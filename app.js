var Entity = require("./classes/Entity.js");
var Ship = require("./classes/Ship.js");
var Bullet = require("./classes/Bullet.js");
var BigBullet = require("./classes/BigBullet")
var SHA256 = require("crypto-js/sha256");
var config = require("./config")
var cluster = require('cluster');
//lsof -i | grep mongo to get the port num
var express = require("express");
var app = express();
var server = require("http").Server(app);
var socketIO = require("socket.io");
var io = socketIO(server);
var port = 3000 || process.env.PORT;
var utils = require("./classes/Utils");
var gameRouter = require("./routes/game");
var gameState = {
  ships: {}
};
var workers = [];

const setUpExpress = () => {
app.use("/public", express.static(__dirname + "/public"));
app.use("/", gameRouter);

//start the server
server.listen(port, () => {
  console.log(`listening on port: ${port}`);
}); 

 // in case of an error
 app.on('error', (appErr, appCtx) => {
  console.error('app error', appErr.stack);
  console.error('on url', appCtx.req.url);
  console.error('with headers', appCtx.req.headers);
});
}

/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
const setupWorkerProcesses = () => {
  // to read number of cores on system
  let numCores = require('os').cpus().length;
  console.log('Master cluster setting up ' + numCores + ' workers');

  // iterate on number of cores need to be utilized by an application
  // current example will utilize all of them
  for(let i = 0; i < numCores; i++) {
      // creating workers and pushing reference in an array
      // these references can be used to receive messages from workers
      workers.push(cluster.fork());

      // to receive messages from worker process
      workers[i].on('message', function(message) {
          console.log(message);
      });
  }

  // process is clustered on a core and process id is assigned
  cluster.on('online', function(worker) {
      console.log('Worker ' + worker.process.pid + ' is listening');
  });

  // if any of the worker process dies then start a new one by simply forking another one
  cluster.on('exit', function(worker, code, signal) {
      console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      console.log('Starting a new worker');
      cluster.fork();
      workers.push(cluster.fork());
      // to receive messages from worker process
      workers[workers.length-1].on('message', function(message) {
          console.log(message);
      });
  });
};


/*MongoDB connection with cloud database*/
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
// Connection URL
const url = config.url;
var db;
// Use connect method to connect to the Server
//{useNewUrlPraser:true}
//listen(3000, hostip,function());
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connection Established");
  db = client.db("planecrashers");
});

function addUser(data, callback) {
  db.collection("account").insertOne({
    username: data.username,
    password: SHA256(data.password).toString(),
    score: 0
  });
  callback();
}

function isUsernameUsed(data, callback) {
  db.collection("account").findOne(
    {
      username: data.username
    },
    function(err, res) {
      if (res != null) callback(true);
      else callback(false);
    }
  );
}

function isValidSignIn(data, callback) {
  db.collection("account").findOne(
    {
      username: data.username,
      password: SHA256(data.password).toString()
    },
    function(err, user) {
      if (user) callback(true);
      else callback(false);
    }
  );
}

function getScore(username, callback) {
  db.collection("account")
    .find({ username: username }, { score: 1 })
    .toArray(function(err, result) {
      //list all the matching documents (which is one since names are unique)
      callback(result[0].score);
    });
}

/*the reason we're using callback functions is that fetching from the database
might take some time and therefore our functions would be returning values too
early before the function fetches the data. Now the function only works when
the data is ready for use. This is just like the io.sockets.on function. it
waits for a socket to connect then do the commands.*/

io.sockets.on("connection", function(socket) {
  console.log("connected");
  socket.on("signUp", function(data) {
    isUsernameUsed(data, function(used) {
      if (!used) {
        /*so we add the user with the data AND ONLY AFTER THAT IS DONE we
                emit to the client*/
        addUser(data, function() {
          socket.emit("signUpValidation", true);
        });
      } else socket.emit("signUpValidation", false);
    });
  });
  //after recieving the userName from the client
  socket.on("signIn", function(data) {
    isValidSignIn(data, function(valid) {
      if (valid) {
        gameState.ships[socket.id] = new Ship(
          Math.random() * 300,
          Math.random() * 300,
          0,
          data.username
        );
        getScore(data.username, function(score) {
          gameState.ships[socket.id].score = score;
          io.sockets.emit("newPlayer", gameState.ships);
          socket.emit("signInValidation", true);
        });
      } else {
        socket.emit("signInValidation", false);
      }
    });
  });

  socket.on("fireNormalBullet", function() {
    var ship = gameState.ships[socket.id];
    ship.bullets[Math.random()] = new Bullet(
      ship.x,
      ship.y,
      ship.angle,
      socket.id
    );
    socket.emit("playSound");
    });

  socket.on("fireBigBullet", function() {
    var ship = gameState.ships[socket.id];
    if(ship.score > 50){
    ship.bullets[Math.random()] = new BigBullet(
      ship.x,
      ship.y,
      ship.angle,
      socket.id
    );
    socket.emit("playSound");
    ship.score -= 50;
    }
  });

  socket.on("thrust", function(data) {
    try {
      gameState.ships[socket.id].isThrusting = data;
    }
    catch(err) {
      console.log(err);
    }
  });

  socket.on("messageToServer", function(data) {
    io.sockets.emit("messageToClients", data);
  });

  socket.on("mouseCoordinates", function(data) {
    var ship = gameState.ships[socket.id];
    //this -80 needs to be removed. This is just a brute force solution to
    //align the heading of the ship with the mouse.
    if (typeof ship != "undefined") {
      var angle = Math.atan2(data.mouseX - ship.x, -(data.mouseY - ship.y));
      ship.angle = angle;
    }
  });

  socket.on("disconnect", function() {
    var ship = gameState.ships[socket.id];
    if (utils.checkValidity(ship)) {
      db.collection("account").update(
        { username: ship.userName },
        { $set: { score: ship.score } }
      );
      delete gameState.ships[socket.id];
      //emiting the list after someone disconnects for it to be updated.
      io.sockets.emit("newPlayer", gameState.ships);
    }
    console.log("disconnected");
  });
});

setInterval(function() {
  //moving all ships
  if(Object.keys(gameState.ships).length !== 0){
  for (var i in gameState.ships) {
    var ship = gameState.ships[i];
    ship.update();
    //going over every bullet in every ship
    for (var j in ship.bullets) {
      var bullet = ship.bullets[j];
      bullet.checkBounds();
      if(bullet.constructor.name === "BigBullet"){
        bullet.checkRange();
      }
      
      //checking collision for each bullet with each ship
      for (var k in gameState.ships) {
        var enemyShip = gameState.ships[k];
        //checking for collision with other ships but execluding the one that is shooting the bullet which has the socketid k
        if (utils.checkCollision(enemyShip, bullet) && bullet.parentUniqueId != k) {
          //increasing the score of the ship that shot the bullet
          var shipThatHit = gameState.ships[bullet.parentUniqueId];
          shipThatHit.score += 4;
          if(bullet.constructor.name === "BigBullet"){
            bullet.toExplode = true;
          }else{ 
            bullet.toRemove = true;
          }
          if ((enemyShip.hitPoints -= 10) == 0)
              enemyShip.toRespawn = true;
        }
      }
      //removing bullets when toRemove is true
      if (ship.bullets[j].toRemove) {
        delete ship.bullets[j];
        continue;
      }
      if (ship.bullets[j].toExplode) {
          ship.bullets[j].explode().forEach(smallBullet => {
            ship.bullets[Math.random()] = smallBullet;
        })
      }
      //moving the bullet
      ship.bullets[j].update();
    }
  }


  io.sockets.emit("newPosition", gameState);
}
}, 1000 / 60);

/**
 * Setup server either with clustering or without it
 * @param isClusterRequired
 * @constructor
 */
const setupServer = (isClusterRequired) => {

  // if it is a master process then call setting up worker process
  if(isClusterRequired && cluster.isMaster) {
      setupWorkerProcesses();
  } else {
      // to setup server configurations and share port address for incoming requests
      setUpExpress();
  }
};

setupServer(true);