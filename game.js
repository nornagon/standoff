var D, Game, ScoreText, canvas, ctx, game, generateGrid, opposite, randomDirection, removeUselessGuys, τ;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
}, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
canvas = atom.canvas;
canvas.width = 800;
canvas.height = 600;
ctx = atom.context;
ctx.scale(1, -1);
ctx.translate(0, -600);
τ = Math.PI * 2;
game = null;
D = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0]
};
opposite = {
  'up': 'down',
  'down': 'up',
  'left': 'right',
  'right': 'left'
};
randomDirection = function() {
  var r;
  r = Math.random() * 4;
  return ['up', 'down', 'left', 'right'][Math.floor(r)];
};
generateGrid = function(size) {
  var count, g, oneGrid, _results;
  oneGrid = function() {
    var grid, i, _ref;
    grid = new Array(size * size);
    for (i = 0, _ref = grid.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      grid[i] = randomDirection();
    }
    while (true) {
      if (!removeUselessGuys(grid, size)) {
        break;
      }
    }
    return grid;
  };
  count = function(g) {
    var d, i, n, _len;
    n = 0;
    for (i = 0, _len = g.length; i < _len; i++) {
      d = g[i];
      if (d) {
        n++;
      }
    }
    return n;
  };
  _results = [];
  while (true) {
    g = oneGrid();
    if (count(g) >= 0.9 * size * size) {
      return g;
    }
  }
  return _results;
};
removeUselessGuys = function(grid, size) {
  var canBlock, canDuel, dead, x, y;
  canDuel = function(x, y) {
    var cx, cy, dir, duelFound, dx, dy, _ref;
    dir = grid[x + y * size];
    _ref = D[dir], dx = _ref[0], dy = _ref[1];
    duelFound = false;
    cx = x + dx * 2;
    cy = y + dy * 2;
    while ((0 <= cx && cx < size) && (0 <= cy && cy < size)) {
      if (grid[cx + cy * size] === opposite[dir]) {
        duelFound = true;
        break;
      }
      cx += dx;
      cy += dy;
    }
    return duelFound;
  };
  canBlock = function(x, y) {
    var allDown, allLeft, allRight, allUp, dir, xp, yp, _ref, _ref2, _ref3, _ref4;
    dir = grid[x + y * size];
    allLeft = (_ref = (function() {
      var _results;
      _results = [];
      for (xp = 0; 0 <= x ? xp < x : xp > x; 0 <= x ? xp++ : xp--) {
        _results.push(grid[xp + y * size]);
      }
      return _results;
    })()) != null ? _ref : [];
    allRight = (_ref2 = (function() {
      var _ref3, _results;
      _results = [];
      for (xp = _ref3 = x + 1; _ref3 <= size ? xp < size : xp > size; _ref3 <= size ? xp++ : xp--) {
        _results.push(grid[xp + y * size]);
      }
      return _results;
    })()) != null ? _ref2 : [];
    if (__indexOf.call(allLeft, 'right') >= 0 && __indexOf.call(allRight, 'left') >= 0) {
      return true;
    }
    allDown = (_ref3 = (function() {
      var _results;
      _results = [];
      for (yp = 0; 0 <= y ? yp < y : yp > y; 0 <= y ? yp++ : yp--) {
        _results.push(grid[x + yp * size]);
      }
      return _results;
    })()) != null ? _ref3 : [];
    allUp = (_ref4 = (function() {
      var _ref5, _results;
      _results = [];
      for (yp = _ref5 = y + 1; _ref5 <= size ? yp < size : yp > size; _ref5 <= size ? yp++ : yp--) {
        _results.push(grid[x + yp * size]);
      }
      return _results;
    })()) != null ? _ref4 : [];
    if (__indexOf.call(allDown, 'up') >= 0 && __indexOf.call(allUp, 'down') >= 0) {
      return true;
    }
    return false;
  };
  dead = 0;
  for (y = 0; 0 <= size ? y < size : y > size; 0 <= size ? y++ : y--) {
    for (x = 0; 0 <= size ? x < size : x > size; 0 <= size ? x++ : x--) {
      if (!grid[x + y * size]) {
        continue;
      }
      if (!(canBlock(x, y) || canDuel(x, y))) {
        grid[x + y * size] = null;
        dead++;
      }
    }
  }
  return dead;
};
ScoreText = (function() {
  function ScoreText(x, y, score, round) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.round = round;
    this.t = this.age = 0;
    this.maxAge = 1;
  }
  ScoreText.prototype.update = function(dt) {
    this.age += dt;
    return this.t = this.age / this.maxAge;
  };
  ScoreText.prototype.font = function() {
    return "" + (20 + this.round * 5) + "px KongtextRegular, sans-serif";
  };
  ScoreText.prototype.draw = function() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, -1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = this.font();
    ctx.fillStyle = "rgba(255,0,0," + (1 - this.t) + ")";
    ctx.fillText(this.score * this.round, 0, -this.t * 20);
    return ctx.restore();
  };
  ScoreText.prototype.alive = function() {
    return this.t <= 1;
  };
  return ScoreText;
})();
Game = (function() {
  var arrowSize;
  __extends(Game, atom.Game);
  arrowSize = 60;
  function Game() {
    this.size = 10;
    this.grid = generateGrid(this.size);
    this.points = 0;
    this.dirty = true;
    this.state = 'ready';
    this.time = 0;
    this.animTime = 0.6;
    this.round = 1;
    this.particles = [];
  }
  Game.prototype.update = function(dt) {
    var gridx, gridy, i, mx, my, p, _i, _len, _ref;
    if (this.particles.length > 0) {
      this.dirty = true;
    }
    _ref = this.particles;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      p = _ref[_i];
      p.update(dt);
    }
    i = 0;
    while (i < this.particles.length) {
      p = this.particles[i];
      if (!p.alive()) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.length--;
      } else {
        i++;
      }
    }
    switch (this.state) {
      case 'ready':
        if (atom.input.pressed('click')) {
          mx = atom.input.mouse.x;
          my = 600 - atom.input.mouse.y;
          gridx = Math.floor(mx / arrowSize);
          gridy = Math.floor(my / arrowSize);
          return this.clicked(gridx, gridy);
        }
        break;
      case 'animating':
        if ((this.time += dt) >= this.animTime) {
          this.time = 0;
          if (this.resolveDuels()) {
            return this.dirty = true;
          } else {
            this.state = 'ready';
            return this.round = 1;
          }
        }
    }
  };
  Game.prototype.clicked = function(x, y) {
    if (!((0 <= x && x < this.size) && (0 <= y && y < this.size))) {
      return;
    }
    if (!this.grid[y * this.size + x]) {
      return;
    }
    this.grid[y * this.size + x] = null;
    if (this.duelsExist()) {
      this.state = 'animating';
      this.time = 0;
    }
    return this.dirty = true;
  };
  Game.prototype.duelsExist = function() {
    return this.resolveDuels(false);
  };
  Game.prototype.resolveDuels = function(die) {
    var dead, deadSet, dir, distance, dx, dy, midx, midy, px, py, x, y, _i, _len, _ref, _ref2, _ref3, _ref4;
    if (die == null) {
      die = true;
    }
    dead = [];
    deadSet = {};
    for (y = 0, _ref = this.size; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
      for (x = 0, _ref2 = this.size; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
        dir = this.grid[y * this.size + x];
        if (!dir) {
          continue;
        }
        if ([x, y] in deadSet) {
          continue;
        }
        _ref3 = {
          up: [0, 1],
          down: [0, -1],
          left: [-1, 0],
          right: [1, 0]
        }[dir], dx = _ref3[0], dy = _ref3[1];
        px = x + dx;
        py = y + dy;
        distance = 0;
        while (px + dx < this.size && py + dy < this.size && px + dx >= 0 && py + dy >= 0) {
          if (this.grid[py * this.size + px]) {
            break;
          }
          px += dx;
          py += dy;
          distance++;
        }
        if (distance > 0 && dir === opposite[this.grid[py * this.size + px]]) {
          dead.push([x, y], [px, py]);
          deadSet[[x, y]] = deadSet[[px, py]] = true;
          if (die) {
            this.points += distance * this.round;
            midx = (0.5 + (x + px) / 2) * arrowSize;
            midy = (0.5 + (y + py) / 2) * arrowSize;
            midx += (Math.random() * 2 - 1) * arrowSize * 0.4;
            midy += (Math.random() * 2 - 1) * arrowSize * 0.4;
            this.particles.push(new ScoreText(midx, midy, distance, this.round));
          }
        }
      }
    }
    if (die) {
      for (_i = 0, _len = dead.length; _i < _len; _i++) {
        _ref4 = dead[_i], x = _ref4[0], y = _ref4[1];
        this.grid[y * this.size + x] = null;
      }
      if (dead.length > 0) {
        this.round++;
      }
    }
    return dead.length;
  };
  Game.prototype.draw = function() {
    var g, p, x, y, _i, _len, _ref, _ref2, _ref3;
    if (!this.dirty) {
      return;
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (y = 0, _ref = this.size; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
      for (x = 0, _ref2 = this.size; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
        g = this.grid[y * this.size + x];
        if (g) {
          this.drawArrow(x, y, g);
        }
      }
    }
    _ref3 = this.particles;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      p = _ref3[_i];
      p.draw();
    }
    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(800, -600);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = '40px KongtextRegular, sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText("" + this.points, -10, 10);
    ctx.restore();
    return this.dirty = false;
  };
  Game.prototype.duelling = function(x, y) {
    var dir, distance, dx, dy, px, py, _ref, _ref2, _ref3;
    dir = this.grid[y * this.size + x];
    if (!dir) {
      return false;
    }
    _ref = D[dir], dx = _ref[0], dy = _ref[1];
    px = x + dx;
    py = y + dy;
    distance = 0;
    while ((0 <= (_ref2 = px + dx) && _ref2 < this.size) && (0 <= (_ref3 = py + dy) && _ref3 < this.size)) {
      if (this.grid[py * this.size + px]) {
        break;
      }
      px += dx;
      py += dy;
      distance++;
    }
    return distance >= 1 && this.grid[py * this.size + px] === opposite[dir];
  };
  Game.prototype.drawArrow = function(x, y, dir) {
    ctx.save();
    ctx.translate((x + 0.5) * arrowSize, (y + 0.5) * arrowSize);
    ctx.rotate({
      right: 0,
      up: τ / 4,
      left: τ / 2,
      down: τ * 3 / 4
    }[dir]);
    ctx.scale(0.7, 0.7);
    ctx.lineWidth = arrowSize * 0.2;
    ctx.beginPath();
    ctx.moveTo(-arrowSize / 2, 0);
    ctx.lineTo(arrowSize / 2, 0);
    ctx.moveTo(0, -arrowSize / 2);
    ctx.lineTo(arrowSize / 2, 0);
    ctx.lineTo(0, arrowSize / 2);
    ctx.strokeStyle = this.duelling(x, y) ? 'red' : 'black';
    ctx.stroke();
    return ctx.restore();
  };
  return Game;
})();
atom.input.bind(atom.button.LEFT, 'click');
game = new Game;
window.onload = function() {
  window.onblur = function() {
    return game != null ? game.stop() : void 0;
  };
  window.onfocus = function() {
    return game != null ? game.run() : void 0;
  };
  return game.run();
};