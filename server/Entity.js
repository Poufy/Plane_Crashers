var Entity   = function(x,y,angle){
    var self = {
        x:x,
        y:y,
        angle:angle,
        velocity:2
    }
    self.update = function(){
      self.x += self.velocity * Math.sin(self.angle);
      self.y -= self.velocity * Math.cos(self.angle);
    }
    return self;
}
