var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');
var connectedPlayers = document.getElementById('connected-players');
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = "bold 10pt Courier";
var socket = io();
/*setting default values so game does not bug out by sending null mouseX and
 mouseY values when cursor is initially off the canvas.*/
var mouseX = 0;
var mouseY = 0;

/*Handling the login*/
var sign = document.getElementById('sign');
var signInUsername = document.getElementById('sign-username');
var signInPassword = document.getElementById('sign-password');
var signin = document.getElementById('sign-signin');
var signup = document.getElementById('sign-signup');

var register = document.getElementById('register');
var registerUsername = document.getElementById('register-username');
var registerPassword = document.getElementById('register-password');
var registerSignup = document.getElementById('register-signup');
var allowEventEmition = false; //mouse and key tracking are being emiting on the
//sign in screen so this prevents it and only works after loging in.

playSound('soundtrack');
//Handling the signin
/*Here we send the username and the password entered by the client to the server
 to be validated there and then we recieve wether the validation was successful
 or not*/
signin.onclick = function() {
    playSound('button');
    socket.emit('signIn', {
        username: signInUsername.value,
        password: signInPassword.value
    });
}

signup.onclick = function() {
    playSound('button');
    sign.style.display='none';
    register.style.display = 'inline';
}

registerSignup.onclick = function() {
  playSound('button');
  socket.emit('signUp', {
      username: registerUsername.value,
      password: registerPassword.value
  });
  register.style.display = 'none';
  sign.style.display = 'inline';

}
socket.on('signInValidation', function(data) {
    if (data) {
        signincontainer.style.display = 'none';
        document.body.style.backgroundColor = "white";
        game.style.display = 'inline';
        allowEventEmition = true;
    } else {
        alert('Wrong user information.');
    }
});

socket.on('signUpValidation', function(data) {
    if (data)
        alert('SignUp successful!');
    else
        alert('Username is already taken!')

});

/*Handling the chat*/
chatForm.onsubmit = function(event) {
    event.preventDefault(); //prevent the browser from refreshing.
    socket.emit('messageToServer', {message: chatInput.value, username: signInUsername.value});
    chatInput.value = '';
}

socket.on('messageToClients', function(data) {
  //time stamps for the chat
  var today = new Date();
  var time = today.getHours() + ":" + today.getMinutes() + ":" +
      today.getSeconds() + ' ';

    chatText.innerHTML += '<div>' + time + ' ' + data.username + ' : ' +
        data.message.fontcolor("#32ff7e") + '</div>';
});

//appending player username to connected users window
socket.on('newPlayer', function(data) {
    connectedPlayers.innerHTML = '<div>Connected Players</div>';
    for (var id in data) {
        connectedPlayers.innerHTML += '<div>Username: ' +
            data[id].userName.fontcolor("#32ff7e") + '</div>'
    }
});

/*Loading the images*/
var Img = {};
const backgroundImage = Img.background = new Image();
backgroundImage.src = '/public/images/background.JPG';
const planeImage = new Image();
planeImage.src = '/public/images/smallPlane.png';
const bulletImage = new Image();
bulletImage.src = '/public/images/bullet.png';

/*Drawing*/

socket.on('newPosition', function(data) {
  if (allowEventEmition)
      socket.emit('mouseCoordinates', {
          mouseX: mouseX,
          mouseY: mouseY
      });
    drawBackground();
    for (var i in data.ships) {
        var ship = data.ships[i];
        //drawing the ships
        var healthBarWidth = 30 * ship.hitPoints / 100;
        /*Closest attempt
        ctx.translate(ship.x+planeImage.width/2, ship.y+planeImage.height/2);
        ctx.rotate(ship.angle);
        ctx.drawImage(planeImage, -planeImage.width/2, -planeImage.height/2);*/
        ctx.save();
        // ctx.translate(ship.x+planeImage.width/2, ship.y+planeImage.height/2);
        // ctx.rotate(ship.angle);
        // ctx.drawImage(planeImage, -planeImage.width/2, -planeImage.height/2);
        ctx.translate(ship.x + planeImage.width/2, ship.y + planeImage.height/2);
        ctx.rotate(ship.angle);
        ctx.drawImage(planeImage, -planeImage.width / 2, -planeImage.height / 2, planeImage.width, planeImage.height); //draw the image ;)
        ctx.restore();

        ctx.save();
        ctx.translate(ship.x+40, ship.y);
        //drawing healthbars
        ctx.fillStyle = "red";
        ctx.fillRect(0,0,75,5);
        ctx.fillStyle = "green";
        ctx.fillRect(0,0,75*ship.hitPoints/100,5);
        //drawing score
        ctx.fillText(ship.score, 0,-4);
        ctx.fillText(ship.userName,30 ,-4);
        ctx.restore();

        for (var k in ship.bullets) {
            ctx.save();
            ctx.translate(ship.bullets[k].x+planeImage.width/2, ship.bullets[k].y+planeImage.height/2);
            ctx.rotate(ship.bullets[k].angle);
            ctx.drawImage(bulletImage,-planeImage.width/2 + bulletImage.width/2+21, -planeImage.height/2-bulletImage.height/2);
            ctx.restore();

        }
    }
});

socket.on('playSound', function(){
  playSound('gun');
});

function drawHealthBars(context){
  var healthBarWidth = 30 * ship.hitPoints / 100;
  ctx.save();
  ctx.translate(ship.x+40, ship.y);
  ctx.fillStyle = "red";
  ctx.fillRect(0,0,75,5);
  ctx.fillStyle = "green";
  ctx.fillRect(0,0,75*ship.hitPoints/100,5);
  ctx.restore();
}

//emiting the mouse Coordinates to the server to calculate the angle there.
document.addEventListener("mousemove", function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});


/*Handling the key presses*/
document.onkeydown = function(event) {
    if (event.keyCode === 87 && allowEventEmition)
        socket.emit('thrust', true);
}

document.onmousedown = function(event) {
    if (allowEventEmition)
        socket.emit('fire');
}
document.onkeyup = function(event) {
    if (event.keyCode === 87 && allowEventEmition)
        socket.emit('thrust', false);
}

function drawBackground(){
    ctx.drawImage(backgroundImage,0,0);
}

function playSound(which){
  if(which === 'gun'){
    var gunSound = new Audio('/public/sounds/gunfire.mp3');
    gunSound.volume = 0.4;
    gunSound.play();
  }else if(which === 'button'){
    var buttonSound = new Audio('/public/sounds/button.mp3');
    buttonSound.play();
  }else if(which === 'soundtrack'){
    // var soundTrack = new Audio('/public/sounds/soundtrack.mp3');
    // soundTrack.loop = true;
    // soundTrack.volume = 0.4;
    // soundTrack.play();
  }
}
