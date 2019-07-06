# Plane_Crashers
Shooting planes and a side chat made with HTML5 canvas and nodejs for the backend server

# To run the game
git clone https://github.com/Poufy/Plane_Crashers.git

Navigate to where you cloned the repository 

Make sure you have Nodejs and npm installed, also a running instance of mongodb.

In your terminal: 
```bash
npm install --save express socket.io
node app.js
```

then open the browser of your choice and navigate to localhost:3000

# TODO
- [ ] Bullets collision(done)
- [ ] Add user names to ship object(done)
- [ ] Add time stamps to chat and connected time to connected players(done)
- [ ] Replace connected players with an image and also add a logo
- [ ] Put Entity/Ship/Bullet in seperate files
- [ ] Add score/levels on database and on screen for each ship
