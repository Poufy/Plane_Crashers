function Entity(x,y,angle){
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.velocity = 9;
  this.update = function() {
    this.x += this.velocity * Math.sin(this.angle);
    this.y -= this.velocity * Math.cos(this.angle);
  }
}

module.exports = Entity;
