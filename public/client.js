var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');
var connectedPlayers = document.getElementById('connected-players');

var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';
var socket = io();
//setting default values so game does not bug out by sending null mouseX and mouseY values when cursor is initially off the canvas.
var mouseX = 0;
var mouseY = 0;
//time stamps for the chat
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + ' ';
var userName = prompt('Please enter your username.');

socket.emit('userName', userName);
/*Handling the chat*/
chatForm.onsubmit = function(event){
  event.preventDefault(); //prevent the browser from refreshing.
  socket.emit('messageToServer' , time + ' ' + userName + ' : '+ chatInput.value);
  chatInput.value = '';
}

socket.on('messageToClients', function(data){
  chatText.innerHTML += '<div>' + data + '</div>';
});

//appending player userName
socket.on('newPlayer', function(data){
  connectedPlayers.innerHTML = 'Connected Players';
  for(var id in data){
    connectedPlayers.innerHTML += '<div>id: ' + data[id].userName + '</div>'
  }
      });



//emiting the mouse Coordinates to the server to calculate the angle there.
document.addEventListener("mousemove", function(event){
  mouseX = event.clientX;
  mouseY = event.clientY;
});


/*Drawing*/
socket.on('newPosition', function(data){
  //clearing the screen
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0,0,820,640);
  socket.emit('mouseCoordinates', {mouseX: mouseX, mouseY: mouseY});
  for(var i in data.ships){
     var ship = data.ships[i];
     //drawing the ships
     ctx.save();
     ctx.translate(ship.x, ship.y);
     ctx.rotate(ship.angle);
     ctx.fillStyle = "#00FF00"
     ctx.fillRect(10, 10,30,30);
     ctx.restore();

     ctx.save();
     ctx.fillStyle = "#00FF00";
     ctx.translate(ship.x, ship.y);
     ctx.fillText(ship.userName,0,0);
     ctx.restore();

     //drawing the bullets
     for(var k in ship.bullets){
       ctx.save();
       ctx.translate(ship.bullets[k].x,ship.bullets[k].y);
       ctx.rotate(ship.bullets[k].angle);
       ctx.fillStyle = "#1ABC9C"
       ctx.fillRect(10, 10,10,10);
       ctx.restore();

     }

}

});
/*Handling the key presses*/

document.onkeydown = function(event){
  if(event.keyCode === 87)
    socket.emit('thrust', true);
}

document.onmousedown = function(event){
  socket.emit('fire');
}
document.onkeyup = function(event){
  if(event.keyCode === 87)
    socket.emit('thrust', false);
}
