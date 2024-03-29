var TurnBased = require('../base/turn_based_game');
var turn_based = new TurnBased();

Race.prototype = turn_based;

function Race(size_y, size_x) {
  this.field = {
    size: {
      x: size_x,
      y: size_y
    }
  }
  this.constructor.prototype.constructor.apply(this);
  this.startPositions = {};
  this.field = this._generateField(this.field);
  this.turns = {};
  
  // for JSON. do we need the history at all?
  Object.defineProperty(this, 'positionHistory', {enumerable: true, get: function() {
    return this.getPositionHistory();
  }});
}

Race.prototype._deco__playerSpecific = function(func) {
  return function(player) {
    var this_ = this;
    if (!player)
      return this.players.reduce(function(sum, player) {
        sum[player.id] = func.call(this_, player);
        return sum;
      }, {});
    else
      return func.call(this_, player);
  }
};

Race.prototype._generateField = function(field) {
  return field;
};

Race.prototype._getCellsRect = function(y1, x1, y2, x2) {
  var ymin = Math.min(y1, y2);
  var ymax = Math.max(y1, y2);
  var xmin = Math.min(x1, x2);
  var xmax = Math.max(x1, x2);
  var cells = [];

  for(var y = ymin; y <= ymax; y++) {
    for(var x = xmin; x <= xmax; x++) {
      cells.push({x: x, y: y, value: this.field[y] && this.field[y][x]});
    } 
  }
  return cells;
};

Race.prototype._getRandomStartLine = function() {
  var vertical = (Math.random() > 0.5),
      x1, x2, y1, y2;
  if (vertical) {
    x1 = x2 = Math.floor(Math.random() * this.field.size.x);
    y1 = 4;
    y2 = 8;
  } else {
    y1 = y2 = Math.floor(Math.random() *this.field.size.y);
    x1 = 4;
    x2 = 8;
  }
  return {y1: y1, x1: x1, y2: y2, x2: x2};
};

Race.prototype.start = function() {
  if (this.can_start) {
    var startLine = this._getRandomStartLine();
    var possibleStartPositions = this._getCellsRect(startLine.y1, startLine.x1, startLine.y2, startLine.x2);
    possibleStartPositions = possibleStartPositions.sort(function(a, b) { return Math.random() > 0.5 })

    for(var i = 0; i < this.players.length; i++) {
      this.turns[this.players[i].id] = [];
      this.startPositions[this.players[i].id] = {
        y: possibleStartPositions[i].y,
        x: possibleStartPositions[i].x
      };
    }
  }
  
  try {
    TurnBased.prototype.start.apply(this, arguments);
  } catch (e) {
    // rollback  
    this.startPositions = {};
    throw e;
  }
};

Race.prototype._applyTurnVector = function(position, vector) {
  return {y: position.y + vector.y, x: position.x + vector.x}
};

Race.prototype.getPositionHistory = Race.prototype._deco__playerSpecific(function(player) {
  var positions = [this.startPositions[player.id]];

  if (this.turns[player.id]) {  
    this.turns[player.id].forEach(function(turn) {
      var lastPosition = positions[positions.length - 1];
      positions.push(this._applyTurnVector(lastPosition, turn));
    }, this);
  }
  
  return positions;
});

Race.prototype._getPlayerIdOnPosition = function(y, x) {
  var positions = this.getPositionHistory(),
      currPos;
  for(var playerId in positions) if (positions.hasOwnProperty(playerId)) {
    currPos = positions[playerId].pop();
    if (currPos.y == y && currPos.x == x)
      return playerId;
  }
  return null;
};

Race.prototype.getAllowedTurns = Race.prototype._deco__playerSpecific(function(player) {
  var lastTurn = this.turns[player.id][this.turns[player.id].length - 1] || {y: 0, x: 0};
  var playerPosition = this.getPositionHistory(player).pop();
  var possibleVectors = [];
  var xNew, yNew, targetCellTakenBy;

  for(var y = -1; y <= 1; y++) {
    for(var x = -1; x <= 1; x++) {
      yNew = lastTurn.y + y;
      xNew = lastTurn.x + x;      
      // no collisions with others allowed
      targetCellTakenBy = this._getPlayerIdOnPosition(playerPosition.y + yNew, playerPosition.x + xNew);
      if(targetCellTakenBy && targetCellTakenBy != player.id ) continue;
      possibleVectors.push({y: yNew, x: xNew});
    }
  }
  return possibleVectors;
});

Race.prototype.makePureTurn = function(player, turn) {
  var jsonTurn = JSON.stringify(turn);
  var allowed = this.getAllowedTurns(player).some(function(turn) {
    return JSON.stringify(turn) == jsonTurn;
  });
   
  if (allowed) {
    this.turns[player.id].push(turn);
  } else {
    throw new Error("Invalid turn");
  }
};

module.exports = Race;