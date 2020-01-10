function getDistance(first, second) {
    //check distance between two Entities
    return Math.sqrt(
      Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2)
    );
  }
  function checkCollision(first, second) {
    return getDistance(first, second) < 25;
  }
  
  
  //dealing with edge cases where the ship object might be undefined
  function checkValidity(obj) {
    if (typeof obj != "undefined") return true;
    else return false;
  }

  module.exports = {
      getDistance: getDistance,
      checkCollision: checkCollision,
      checkValidity: checkValidity
  }