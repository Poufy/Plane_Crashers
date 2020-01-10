var Entity = require('./Entity.js');
var Utils = require('./Utils');

function BigBullet (x, y, angle, parentUniqueId) {
  Entity.call(this,x,y,angle);
    this.toRemove = false;
    this.toExplode = false;
    this.bulletType = "BigBullet";
    this.parentUniqueId = parentUniqueId;
    this.checkBounds = function() {
        if (this.x > 1800 || this.y > 960 || this.x < -40 || this.y < -40)
            this.toRemove = true;
    }
    this.checkRange = function(){
        // var initialX = x;
        // var initialY = y;
        if(Utils.getDistance({x: x, y: y}, {x: this.x, y: this.y}) > 500){
            this.toExplode = true;
        }
    }
    this.explode = function() {
        //Check between the initial distance and the current distance 
        if(this.toExplode == true){
            this.toRemove = true;
            console.log("BOOOM!");
        }
    }
};

module.exports = BigBullet;