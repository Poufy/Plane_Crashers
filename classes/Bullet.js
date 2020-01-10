var Entity = require('./Entity.js');
function Bullet (x, y, angle, parentUniqueId) {
  Entity.call(this,x,y,angle);
    this.toRemove = false;
    this.parentUniqueId = parentUniqueId;
    this.checkBounds = function() {
        if (this.x > 1800 || this.y > 960 || this.x < -40 || this.y < -40)
            this.toRemove = true;
    }
};

module.exports = Bullet;
