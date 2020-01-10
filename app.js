var Entity = require("./classes/Entity.js");
var Ship = require("./classes/Ship.js");
var Bullet = require("./classes/Bullet.js");
var SHA256 = require("crypto-js/sha256");
var config = require("./config")
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

app.use("/public", express.static(__dirname + "/public"));
app.use("/", gameRouter);

server.listen(port, () => {
  console.log(`listening on port: ${port}`);
});

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

  socket.on("fire", function() {
    var ship = gameState.ships[socket.id];
    ship.bullets[Math.random()] = new Bullet(
      ship.x,
      ship.y,
      ship.angle,
      socket.id
    );
    socket.emit("playSound");
    socket.emit("updateScore", ship.score);
  });

  socket.on("thrust", function(data) {
    gameState.ships[socket.id].isThrusting = data;
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
  for (var i in gameState.ships) {
    var ship = gameState.ships[i];
    ship.update();
    //going over every bullet in every ship
    for (var j in ship.bullets) {
      var bullet = ship.bullets[j];
      bullet.checkBounds();
      //checking collision for each bullet with each ship
      for (var k in gameState.ships) {
        var enemyShip = gameState.ships[k];
        //checking for collision with other ships but execluding the one that is shooting the bullet which has the socketid k
        if (utils.checkCollision(enemyShip, bullet) && bullet.parentUniqueId != k) {
          //increasing the score of the ship that shot the bullet
          var shipThatHit = gameState.ships[bullet.parentUniqueId];
          shipThatHit.score += 4;
          bullet.toRemove = true;
          if ((enemyShip.hitPoints -= 10) == 0) enemyShip.toRespawn = true;
        }
      }
      //removing bullets when toRemove is true
      if (ship.bullets[j].toRemove) {
        delete ship.bullets[j];
        continue;
      }
      //moving the bullet
      ship.bullets[j].update();
    }
  }

  io.sockets.emit("newPosition", gameState);
}, 1000 / 30);

// function getDistance(first, second) {
//   //check distance between two Entities
//   return Math.sqrt(
//     Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2)
//   );
// }
// function checkCollision(first, second) {
//   return getDistance(first, second) < 25;
// }


// //dealing with edge cases where the ship object might be undefined
// function checkValidity(obj) {
//   if (typeof obj != "undefined") return true;
//   else return false;
// }
