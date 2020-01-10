# Plane_Crashers
Mini plane shooting game with a side chat made with HTML5 Canvas, SocketIO, and Nodejs for the backend server.

# To run the game
```bash
git clone https://github.com/Poufy/Plane_Crashers.git
```
Navigate inside the cloned repository

Make sure you have Nodejs and npm installed
```bash
npm install --save express socket.io crypto-js mongodb
node app.js
```
Then open a browser of your choice and navigate to localhost:3000

# TODO
- [x] Bullets collision

- [x] Add user names to ship object

- [x] Add time stamps to chat and connected time to connected players

- [x] Replace connected players with an image and also add a logo

- [x] Put Entity/Ship/Bullet in seperate files

- [x] Add score/levels on database and on screen for each ship

- [ ] deal with edge cases like very long names.

- [x] save score on the database on disconnect.

- [x] Add a list of features and controls left to the signin menu.

- [ ] Add new attacks like shotgun or missiles in the future.

- [x] Host the game on server.

- [ ] Clean up the app class, add a server.js file as an entry point to the game.


