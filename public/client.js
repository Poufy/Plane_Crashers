var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');
var connectedPlayers = document.getElementById('connected-players');
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';
var socket = io();
/*setting default values so game does not bug out by sending null mouseX and
 mouseY values when cursor is initially off the canvas.*/
var mouseX = 0;
var mouseY = 0;
//time stamps for the chat
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" +
 today.getSeconds() + ' ';
//var userName; //= prompt('Please enter your username.');





/*Handling the login*/
var sign = document.getElementById('sign');
var username = document.getElementById('sign-username');
var password = document.getElementById('sign-password');
var signin = document.getElementById('sign-signin');
var signup = document.getElementById('sign-signup');
var allowEventEmition = false; //mouse and key tracking are being emiting on the
//sign in screen so this prevents it and only works after loging in.


//Handling the signin
/*Here we send the username and the password entered by the client to the server
 to be validated there and then we recieve wether the validation was successful
 or not*/
signin.onclick = function(){
  socket.emit('signIn', {username: username.value,password: password.value});
}

signup.onclick = function(){
  socket.emit('signUp', {username: username.value, password: password.value});
  username.value = '';
  password.value = '';
}

socket.on('signInValidation', function(data){
  console.log(data);
    if(data){
      sign.style.display = 'none';
      game.style.display = 'inline';
      allowEventEmition = true;
    }
    else{
        console.log('Wrong user information.')
    }
});

/*Handling the chat*/
chatForm.onsubmit = function(event){
  event.preventDefault(); //prevent the browser from refreshing.
  socket.emit('messageToServer' , chatInput.value);
  chatInput.value = '';
}

socket.on('messageToClients', function(data){
  chatText.innerHTML += '<div>' + time + ' ' + userName + ' : '+
    data.fontcolor("green") + '</div>';
});

//appending player userName
socket.on('newPlayer', function(data){
  connectedPlayers.innerHTML = 'Connected Players';
  for(var id in data){
    connectedPlayers.innerHTML += '<div>id: ' +
     data[id].userName.fontcolor("green") + '</div>'
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
  if(allowEventEmition)
    socket.emit('mouseCoordinates', {mouseX: mouseX, mouseY: mouseY});
  for(var i in data.ships){
     var ship = data.ships[i];
     //drawing the ships
     ctx.save();
     ctx.translate(ship.x, ship.y);
     ctx.rotate(ship.angle);
     ctx.fillStyle = "#00FF00"
     ctx.fillRect(0,0,30,30);
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
       ctx.fillRect(0, 0,10,10);
       ctx.restore();

     }

}

});
/*Handling the key presses*/

document.onkeydown = function(event){
  if(event.keyCode === 87 && allowEventEmition)
    socket.emit('thrust', true);
  else if(event.keyCode === 13)
    socket.emit('signIn', {username: username.value,password: password.value});
}

document.onmousedown = function(event){
  if(allowEventEmition)
    socket.emit('fire');
}
document.onkeyup = function(event){
  if(event.keyCode === 87 && allowEventEmition)
    socket.emit('thrust', false);
}
