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
  }
  return self;
}


var validUsers = {
  'noor': 'noor',
  'walid': 'walid',
  'abd': 'abd'
}


io.sockets.on('connection', function(socket){
      console.log('connected');
      //after recieving the userName from the client
      socket.on('signIn', function(data){
        if(data.username === 'noor' && data.password === 'noor'){
          gameState.ships[socket.id] = new Ship(300,300, 0);
          gameState.ships[socket.id].userName = data.username;

          io.sockets.emit('newPlayer', gameState.ships);
          io.sockets.emit('signInValidation', true);
        }else{
          io.sockets.emit('signInValidation', false);
        }
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
        //checking for collision with other ships but execluding the one that is shooting the bullet which has the socketid k
        if(checkCollision(gameState.ships[k], bullet) && bullet.parentUniqueId != k){
          //we might want to reduce hp of the ship that was hit which has the id k
            bullet.toRemove = true;
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
