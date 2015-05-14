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

Race.prototype._getCellsSquare = function(y1, x1, y2, x2) {
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
    var possibleStartPositions = this._getCellsSquare(startLine.y1, startLine.x1, startLine.y2, startLine.x2);
    possibleStartPositions = possibleStartPositions.sort(function(a, b) { return Math.random() > 0.5 })

    for(var i = 0; i < this.players.length; i++) {
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

Race.prototype.getPositions = function() {
  return this.startPositions;
};

Race.prototype.makePureTurn = function(player, turn) {
  var bothZero = (Math.abs(turn.dx) || Math.abs(turn.dy)) == 0;
  if (Math.abs(turn.dx) <= 1 && Math.abs(turn.dy) <= 1 && !bothZero) {
    if (!this.turns[player.id])
      this.turns[player.id] = [];
    this.turns[player.id].push(turn);
  } else {
    throw new Error("Invalid turn");
  }
};

module.exports = Race;