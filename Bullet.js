function Bullet (x, y, angle, parentUniqueId) {
  Entity.call(this,x,y,angle);
    this.toRemove = false;
    this.parentUniqueId = parentUniqueId;
    this.checkBounds = function() {
        if (this.x > 850 || this.y > 670 || this.x < -40 || this.y < -40)
            this.toRemove = true;
    }
};
