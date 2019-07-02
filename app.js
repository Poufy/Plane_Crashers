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

var Bullet = function(x,y,angle){
    var self = Entity(x,y,angle);
    self.toRemove = false;
    self.velocity = 6;

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

io.sockets.on('connection', function(socket){

      console.log('connected');
      gameState.ships[socket.id] = new Ship(300,300, 0);

      //after recieving the userName from the client
      socket.on('userName', function(data){
          gameState.ships[socket.id].userName = data;
          io.sockets.emit('newPlayer', gameState.ships);
      });



      socket.on('fire', function(){

      var ship = gameState.ships[socket.id];
      ship.bullets[Math.random()] = new Bullet(ship.x, ship.y, ship.angle);

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

  for(var i in gameState.ships){

    var ship = gameState.ships[i];
    ship.update();

    for(var j in ship.bullets){
      ship.bullets[j].checkBounds();
      if(ship.bullets[j].toRemove){
          delete ship.bullets[j];
          //console.log('deleted');
          continue;

        }

      ship.bullets[j].update();
      //
    }

}

  io.sockets.emit('newPosition', gameState);

}, 1000/60)


function getDistance()  {
    //check distance of bullet
}
