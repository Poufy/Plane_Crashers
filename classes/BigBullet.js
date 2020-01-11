var Entity = require('./Entity.js');
var Utils = require('./Utils');
var Bullet = require('./Bullet')

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
        //Check between the initial distance and the current distance 
        if(Utils.getDistance({x: x, y: y}, {x: this.x, y: this.y}) > 500){
            this.toExplode = true;
        }
    }
    this.explode = function() {
        if(this.toExplode == true){
            this.toRemove = true;
            return [new Bullet(this.x, this.y, 0, parentUniqueId),new Bullet(this.x, this.y, Math.PI/4, parentUniqueId),
                new Bullet(this.x, this.y, Math.PI/2, parentUniqueId),new Bullet(this.x, this.y, 3 * Math.PI/4, parentUniqueId)
            ,new Bullet(this.x, this.y, Math.PI, parentUniqueId),new Bullet(this.x, this.y, 5* Math.PI/4 , parentUniqueId),
            new Bullet(this.x, this.y, 3 * Math.PI/2, parentUniqueId),new Bullet(this.x, this.y, 2 * Math.PI, parentUniqueId)]
        }
    }
};

module.exports = BigBullet;