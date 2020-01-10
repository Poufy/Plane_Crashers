var Entity = require('./Entity.js');
function Ship(x, y, angle, username) {
  Entity.call(this,x,y,angle);
    this.velocity = 2;
    this.hitPoints = 100;
    this.maxVelocity = 8;
    this.score = 0;
    this.userName = username;
    this.bullets = {};
    this.toRespawn = false;
    this.isThrusting = false;
    this.hitPoints = 100;
    //Place this in ship class
    this.respawn = function () {
    this.x = Math.random * 400;
    this.y = Math.random * 400;
    this.hitPoints = 100;
    this.toRespawn = false;
}
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
        this.x = Math.random() * 500;
        this.y = Math.random () * 300;
        this.hitPoints = 100;
        this.toRespawn = false;
      }
    }
  }

  module.exports = Ship;
