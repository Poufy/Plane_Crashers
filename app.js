var mongojs = require('mongojs');
var db = mongojs('localhost:27017/planeCrashers', ['account']);
var SHA256 = require('crypto-js/sha256');
//lsof -i | grep mongo to get the port num
var express = require('express');
var app = express();
var server = require('http').Server(app);
var socketIO = require('socket.io');
var io = socketIO(server);
var userName;
var gameState = {
    ships: {},
    //bullets: {}
}
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

server.listen(3000, function() {
    console.log('listening on port: 3000');
});

function Entity(x,y,angle){
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.velocity = 6;
  this.update = function() {
    this.x += this.velocity * Math.sin(this.angle);
    this.y -= this.velocity * Math.cos(this.angle);
  }
}

function Bullet (x, y, angle, parentUniqueId) {
  Entity.call(this,x,y,angle);
    this.toRemove = false;
    this.parentUniqueId = parentUniqueId;
    this.checkBounds = function() {
        if (this.x > 850 || this.y > 670 || this.x < -40 || this.y < -40)
            this.toRemove = true;
    }
}


function Ship(x, y, angle) {
  Entity.call(this,x,y,angle);
    this.velocity = 2;
    this.hitPoints = 100;
    this.maxVelocity = 8;
    this.userName = 'unknown';
    this.bullets = {};
    this.toRespawn = false;
    this.isThrusting = false;
    this.hitPoints = 100;
    this.update = function(){
      if (this.isThrusting) {
          this.velocity += 1;
          this.x += this.velocity * Math.sin(this.angle);
          this.y -= this.velocity * Math.cos(this.angle);
          if (this.velocity >= this.maxVelocity) {
              this.velocity = this.maxVelocity;
          }
      } else {
          if (this.velocity > 0) {
              this.velocity -= 0.4;
              this.x += this.velocity * Math.sin(this.angle);
              this.y -= this.velocity * Math.cos(this.angle);
          }
      }
      if (this.toRespawn) {
          this.x = 100;
          this.y = 100;
          this.hitPoints = 100;
          this.toRespawn = false;
      }
    }
  }

/*Handling the database with mongojs*/

//Check if the list has matching username and password
var isValidSignIn = function(data, callback) {
    db.account.find({
        username: data.username,
        password: SHA256(data.password).toString()
    }, function(err, res) {
        if (res.length > 0)
            callback(true);
        else
            callback(false);
    });
}

//check if the username already exists
var isUsernameUsed = function(username, callback) {
    db.account.find({
        username: username
    }, function(err, res) {
        if (res > 0)
            callback(true);
        else
            callback(false);
    });
}

//adds the user to the collection
var addUser = function(data, callback) {
    db.account.insert({
        username: data.username,
        password: SHA256(data.password).toString()
    });
    callback();
}

/*the reason we're using callback functions is that fetching from the database
might take some time and therefore our functions would be returning values too
early before the function fetches the data. Now the function only works when
the data is ready for use. This is just like the io.sockets.on function. it
waits for a socket to connect then do the commands.*/

io.sockets.on('connection', function(socket) {
    console.log('connected');
    socket.on('signUp', function(data) {
        isUsernameUsed(data, function(used) {
            if (!used) {
                /*so we add the user with the data AND ONLY AFTER THAT IS DONE we
                emit to the client*/
                addUser(data, function() {
                    socket.emit('signUpValidation', true);
                });
            } else
                socket.emit('signUpValidation', false);
        });
    });
    //after recieving the userName from the client
    socket.on('signIn', function(data) {
        isValidSignIn(data, function(valid) {
            if (valid) {
                gameState.ships[socket.id] = new Ship(300, 300, 0);
                gameState.ships[socket.id].userName = data.username;
                io.sockets.emit('newPlayer', gameState.ships);
                socket.emit('signInValidation', true);
            } else {
              socket.emit('signInValidation', false);
            }
        });
    });

    socket.on('fire', function() {
        var ship = gameState.ships[socket.id];
        ship.bullets[Math.random()] = new Bullet(ship.x, ship.y, ship.angle, socket.id);
    });

    socket.on('thrust', function(data) {
        gameState.ships[socket.id].isThrusting = data;
    });

    socket.on('messageToServer', function(data) {
        io.sockets.emit('messageToClients', data);
    });

    socket.on('mouseCoordinates', function(data) {
        var ship = gameState.ships[socket.id];
        var angle = Math.atan2(data.mouseX - ship.x, -(data.mouseY - ship.y));
        ship.angle = angle;
    });

    socket.on('disconnect', function() {
        delete gameState.ships[socket.id];
        //emiting the list after someone disconnects for it to be updated.
        io.sockets.emit('newPlayer', gameState.ships);
        console.log('disconnected');
    });

});

setInterval(function() {
    var pack = [];
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
                var anotherShip = gameState.ships[k];
                //checking for collision with other ships but execluding the one that is shooting the bullet which has the socketid k
                if (checkCollision(anotherShip, bullet) && bullet.parentUniqueId != k) {
                    //we might want to reduce hp of the ship that was hit which has the id k
                    bullet.toRemove = true;
                    if ((anotherShip.hitPoints -= 10) == 0)
                        anotherShip.toRespawn = true;
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

    io.sockets.emit('newPosition', gameState);
}, 1000 / 60);

function getDistance(first, second) {
    //check distance between two Entities
    return Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));
}

function checkCollision(first, second) {
    return getDistance(first, second) < 25;
}

function respawn(ship) {

    ship.x = Math.random * 400;
    ship.y = Math.random * 400;
    ship.hitPoints = 100;

}
