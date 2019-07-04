var mongojs = require('mongojs');
var db = mongojs('localhost:27017/planeCrashers','account');
 //lsof -i | grep mongo to get the port num
 db.account.insert({username: "la", password:"la"});
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
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

 app.use(express.static('public'));

server.listen(3000, function(){
  console.log('listening on port: 2000');
});

var Entity   = function(x,y,angle){
    var self = {
        x:x,
        y:y,
        angle:angle,
        velocity:2
    }
    self.update = function(){
      self.x += self.velocity * Math.sin(self.angle);
      self.y -= self.velocity * Math.cos(self.angle);
    }
    return self;
}

var Bullet = function(x,y,angle, parentUniqueId){
    var self = Entity(x,y,angle);
    self.toRemove = false;
    self.velocity = 6;
    self.parentUniqueId = parentUniqueId;
    self.checkBounds = function(){
      if(self.x > 850 || self.y > 670 || self.x < -40 || self.y < -40)
        self.toRemove = true;
    }
    return self;
}

var Ship = function(x,y,angle){
  var self = Entity(x,y,angle);
  self.isThrusting =  false;
  self.maxVelocity =  8;
  self.userName = 'unknown';
  self.bullets = {};
  self.toRespawn = false;
  self.hitPoints = 100;
  self.update = function(){
    if(self.isThrusting){
      self.velocity += 1;
      self.x += self.velocity * Math.sin(self.angle);
      self.y -= self.velocity * Math.cos(self.angle);
      if(self.velocity >= self.maxVelocity){
          self.velocity = self.maxVelocity;
        }
      }else {
        if(self.velocity > 0){
            self.velocity -= 0.4;
            self.x += self.velocity * Math.sin(self.angle);
            self.y -= self.velocity * Math.cos(self.angle);
          }
        }
    if(self.toRespawn){
      self.x = 100;
      self.y = 100;
      self.hitPoints = 100;
      self.toRespawn = false;
    }

  }

  return self;
}


var validUsers = {'1': '1',
'2': '2'}

var isValidSignIn = function(data, callback){
  callback(validUsers[data.username] == data.password);
}

var isUsernameUsed = function(username, callback){
  var used = false;
  for(var key in validUsers){
    if(username === key)
      used = true;
  }

  callback(used);
}

var addUser = function(data, callback){
  validUsers[data.username] = data.password;
  callback();
}

/*the reason we're using callback functions is that fetching from the database
might take some time and therefore our functions would be returning values too
early before the function fetches the data. Now the function only works when
the data is ready for use. This is just like the io.sockets.on function. it
waits for a socket to connect then do the commands.*/

io.sockets.on('connection', function(socket){
      console.log('connected');
      socket.on('signUp', function(data){
        isUsernameUsed(data, function(used){
          if(!used){
            /*so we add the user with the data AND ONLY AFTER THAT IS DONE we
            emit to the client*/
            addUser(data, function(){
              io.sockets.emit('signUpValidation', true);
            });
          }
          else
            io.sockets.emit('signUpValidation', false);
        });
      });
      //after recieving the userName from the client
      socket.on('signIn', function(data){
        isValidSignIn(data, function(valid){
          if(valid){
            gameState.ships[socket.id] = new Ship(300,300, 0);
            gameState.ships[socket.id].userName = data.username;

            io.sockets.emit('newPlayer', gameState.ships);
            io.sockets.emit('signInValidation', true);
          }else{
            io.sockets.emit('signInValidation', false);
          }
        });
      });

      socket.on('fire', function(){
      var ship = gameState.ships[socket.id];
      ship.bullets[Math.random()] = new Bullet(ship.x, ship.y, ship.angle, socket.id);
    });

    socket.on('thrust', function(data){
      gameState.ships[socket.id].isThrusting = data;
    });

    socket.on('messageToServer', function(data){
      io.sockets.emit('messageToClients',  data);
    });

    socket.on('mouseCoordinates', function(data){
      var ship = gameState.ships[socket.id];
      var angle = Math.atan2(data.mouseX - ship.x, - (data.mouseY - ship.y));
      ship.angle = angle;
    });

    socket.on('disconnect', function(){
      delete gameState.ships[socket.id];
      //emiting the list after someone disconnects for it to be updated.
      io.sockets.emit('newPlayer', gameState.ships);
      console.log('disconnected');
      });

});

setInterval(function(){
  var pack = [];
  //moving all ships
  for(var i in gameState.ships){
    var ship = gameState.ships[i];
    ship.update();
    //going over every bullet in every ship
    for(var j in ship.bullets){
      var bullet = ship.bullets[j];
      bullet.checkBounds();
      //checking collision for each bullet with each ship
      for(var k in gameState.ships){
        var anotherShip = gameState.ships[k];
        //checking for collision with other ships but execluding the one that is shooting the bullet which has the socketid k
        if(checkCollision(anotherShip, bullet) && bullet.parentUniqueId != k){
          //we might want to reduce hp of the ship that was hit which has the id k
            bullet.toRemove = true;
            if((anotherShip.hitPoints -=10) == 0)
              anotherShip.toRespawn = true;
            }
        }
        //removing bullets when toRemove is true
        if(ship.bullets[j].toRemove){
            delete ship.bullets[j];
            continue;
          }
        //moving the bullet
        ship.bullets[j].update();
      }

    }


  io.sockets.emit('newPosition', gameState);
}, 1000/60);

function getDistance(first, second)  {
    //check distance between two Entities
    return Math.sqrt(Math.pow(second.x-first.x,2)+ Math.pow(second.y-first.y,2));
}

function checkCollision(first,second){
  return getDistance(first,second) < 25;
}

function respawn(ship){

    ship.x = Math.random * 400;
    ship.y = Math.random * 400;
    ship.hitPoints = 100;

}
