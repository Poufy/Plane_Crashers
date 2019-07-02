var Bullet = function(x,y,angle){
    var self = Entity(x,y,angle);
    self.toRemove = false;
    self.velocity = 6;

    self.checkBounds = function(){
      if(self.x > 850 || self.y > 670 || self.x < -40 || self.y < -40)
        self.toRemove = true;
    }
    return self;
}
