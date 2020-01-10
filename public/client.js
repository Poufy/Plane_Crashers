var chatInput = document.getElementById("chat-input");
var chatText = document.getElementById("chat-text");
var chatForm = document.getElementById("chat-form");
var connectedPlayers = document.getElementById("connected-players");
var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
var soundTrack = new Audio("/public/sounds/soundtrack.mp3");
ctx.font = "bold 10pt Courier";
var socket = io();
/*setting default values so game does not bug out by sending null mouseX and
 mouseY values when cursor is initially off the canvas.*/
var mouseX = 0;
var mouseY = 0;
const planeVertex = 25;

/*Handling the login*/
var sign = document.getElementById("sign");
var signInUsername = document.getElementById("sign-username");
var signInPassword = document.getElementById("sign-password");
var signin = document.getElementById("sign-signin");
var signup = document.getElementById("sign-signup");

var register = document.getElementById("register");
var registerUsername = document.getElementById("register-username");
var registerPassword = document.getElementById("register-password");
var registerSignup = document.getElementById("register-signup");
var allowEventEmition = false; //mouse and key tracking are being emiting on the
//sign in screen so this prevents it and only works after loging in.

playSound("soundtrack");
//Handling the signin
/*Here we send the username and the password entered by the client to the server
 to be validated there and then we recieve wether the validation was successful
 or not*/
signin.onclick = function() {
  playSound("button");
  socket.emit("signIn", {
    username: signInUsername.value,
    password: signInPassword.value
  });
};

signup.onclick = function() {
  playSound("button");
  sign.style.display = "none";
  register.style.display = "inline";
};

registerSignup.onclick = function() {
  playSound("button");
  socket.emit("signUp", {
    username: registerUsername.value,
    password: registerPassword.value
  });
  register.style.display = "none";
  sign.style.display = "inline";
};
socket.on("signInValidation", function(data) {
  if (data) {
    signincontainer.style.display = "none";
    document.body.style.backgroundColor = "white";
    game.style.display = "inline";
    allowEventEmition = true;
  } else {
    alert("Wrong user information.");
  }
});

socket.on("signUpValidation", function(data) {
  if (data) alert("SignUp successful!");
  else alert("Username is already taken!");
});

/*Handling the chat*/
chatForm.onsubmit = function(event) {
  event.preventDefault(); //prevent the browser from refreshing.
  if (chatInput.value == "!soundtrack") {
    toggleSoundTrack();
  }
  socket.emit("messageToServer", {
    message: chatInput.value,
    username: signInUsername.value
  });
  chatInput.value = "";
};

socket.on("messageToClients", function(data) {
  chatText.innerHTML += `<div> ${
    data.username
  } : ${data.message.fontcolor("#32ff7e")}</div>`;
});

//appending player username to connected users window
// socket.on("newPlayer", function(data) {
//   connectedPlayers.innerHTML = "<div>Connected Players</div>";
//   for (var id in data) {
//     console.log(data[id].userName);
//     connectedPlayers.innerHTML += `<div>Username: ${data[id].userName.fontcolor(
//       "32ff7e"
//     )}</div>`;
//   }
// });

/*Drawing*/

socket.on("newPosition", function(data) {
  if (allowEventEmition)
    socket.emit("mouseCoordinates", {
      mouseX: mouseX,
      mouseY: mouseY
    });
  drawBackground();
  for (var i in data.ships) {
    var ship = data.ships[i];
    //drawing the ships
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(planeVertex/2, planeVertex);
    ctx.lineTo(-planeVertex/2, planeVertex);
    ctx.closePath();
    ctx.rotate(Math.PI / 1);
    ctx.fillStyle = "green";
    ctx.fill();

    // ctx.drawImage(
    //   planeImage,
    //   -planeImage.width / 2,
    //   -planeImage.height / 2,
    //   planeImage.width,
    //   planeImage.height
    // ); //draw the image ;)
    ctx.restore();

    ctx.save();
    ctx.translate(ship.x - planeVertex, ship.y - planeVertex * 1.5);
    //drawing healthbars
    ctx.fillStyle = "red";
    ctx.fillRect(-15, 0, 75, 5);
    ctx.fillStyle = "green";
    ctx.fillRect(-15, 0, (75 * ship.hitPoints) / 100, 5);
    //drawing score
    ctx.fillText(ship.score, 0, -4);
    ctx.fillText(ship.userName, 30, -4);
    ctx.restore();

    for (var k in ship.bullets) {
      ctx.save();
      ctx.translate(ship.bullets[k].x, ship.bullets[k].y);
      ctx.beginPath();
      if(ship.bullets[k].bulletType == "BigBullet"){
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
      }else{
        ctx.arc(0, 0, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "yellow";
      }
      ctx.fill();
      ctx.restore();
    }
  }
});

socket.on("playSound", function() {
  playSound("gun");
});

function drawHealthBars(context) {
  ctx.save();
  ctx.translate(ship.x + 40, ship.y);
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 75, 5);
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, (75 * ship.hitPoints) / 100, 5);
}

//emiting the mouse Coordinates to the server to calculate the angle there.
document.addEventListener("mousemove", function(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

/*Handling the key presses*/
document.onmousedown = function(event) {
  if (allowEventEmition) socket.emit("fireNormalBullet");
};

document.addEventListener("keypress", function(event) {
  if (event.keyCode == 32 && allowEventEmition) {
    socket.emit("fireBigBullet");
  }
})

//Moving forward on key hold
document.onkeydown = function(event) {
  if (event.keyCode === 87 && allowEventEmition) socket.emit("thrust", true);
};
//Moving stopping gradually on key release
document.onkeyup = function(event) {
  if (event.keyCode === 87 && allowEventEmition) socket.emit("thrust", false);
};

function drawBackground() {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  canvasW = canvas.width;
  canvasH = canvas.height;
  ctx.fillStyle = "#fffff";
  ctx.fillRect(0, 0, canvasW, canvasH);
}

function playSound(sound) {
  if (sound === "gun") {
    var gunSound = new Audio("/public/sounds/gunfire.mp3");
    gunSound.volume = 0.4;
    gunSound.play();
  } else if (sound === "button") {
    var buttonSound = new Audio("/public/sounds/button.mp3");
    buttonSound.play();
  } else if (sound === "soundtrack") {
    soundTrack.loop = true;
    soundTrack.volume = 0.1;
    soundTrack.play();
  }
}

function toggleSoundTrack() {
  if (soundTrack.paused) soundTrack.play();
  else soundTrack.pause();
}
