var TurnBased = require('../../base/turn_based_game');
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
}

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

// @todo: add data redundancy for the sake of performance in case if the current approach with
// each time calculation works bad
Race.prototype.getPositionHistory = function(player) {
  // @todo: replace with => once is supported by --harmony
  var this_ = this;
  if (!player)
    return this.players.reduce(function(sum, player) {
      sum[player.id] = this_.getPositionHistory(player);
      return sum;
    }, {});
  
  var positions = [this.startPositions[player.id]];

  this.turns[player.id].forEach(function(turn) {
    var last_position = positions[positions.length - 1];
    positions.push(this._applyTurnVector(last_position, turn));
  }, this);
  
  return positions;
};


Race.prototype.makePureTurn = function(player, turn) {
  var lastTurn = this.turns[player.id][this.turns[player.id].length - 1] || {y: 0, x: 0};
  var dx = Math.abs(lastTurn.x - turn.x);
  var dy = Math.abs(lastTurn.y - turn.y);
  var bothZero = dx == 0 && dy == 0;
  
  if (dx <= 1 && dy <= 1 && !bothZero) {
    if (!this.turns[player.id])
      this.turns[player.id] = [];
    this.turns[player.id].push(turn);
  } else {
    throw new Error("Invalid turn");
  }
};

module.exports = Race;