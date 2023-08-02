function GameManager(size, InputManager, Actuator, StorageManager) {
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;
  this.size           = this.storageManager.getSize() || size; // Size of the grid

  this.startTiles     = 1;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("invert", this.invert.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.setup();
}



GameManager.prototype.invert = function (dir) {
  // create map
  var map = Array(this.size)
  for (let i = 0; i < this.size; i++) {
    var row = Array(this.size)
    map[i] = row
    for (let j = 0; j < this.size; j++) {
      row[j] = [i, j]
    }
  }
  if(dir == "clockwise")
  map = map[0].map((val, index) => map.map(row => row[index]).reverse())
  if(dir == "counterclockwise")
  map = map[0].map((val, index) => map.map(row => row[index]).reverse()).map(row => row.reverse()).slice().reverse()
  if(dir == "vertical")
  map.map(row => row.reverse());
  if(dir == "horisontal")
  map = map.slice().reverse();
  var temp_grid = JSON.parse(JSON.stringify(this.grid.cells))
  for (let i = 0; i < this.size; i++) {
    for (let j = 0; j < this.size; j++) {
      temp_grid[map[i][j][0]][map[i][j][1]] = this.grid.cells[i][j]
      if(temp_grid[map[i][j][0]][map[i][j][1]])
      {
        temp_grid[map[i][j][0]][map[i][j][1]].previousPosition = {"x":i, "y": j}
        temp_grid[map[i][j][0]][map[i][j][1]].updatePosition({"x": map[i][j][0], "y": map[i][j][1]})
      }
    }
  }
  this.grid.cells = temp_grid;
  this.actuate()
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  let newSize = parseInt(document.getElementById("size").value)
  if(!isNaN(newSize) && this.size != newSize)
  {
    this.size = newSize;
    generateBoard(this)
    //new GameManager(parseInt(document.getElementById("size").value), KeyboardInputManager, HTMLActuator, LocalStorageManager);
  }
  this.storageManager.setSize(this.size);
  this.setup();
};

function generateBoard(self)
{
  function createClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
      (style.styleSheet || style.sheet).addRule(name, rules);
    else
      style.sheet.insertRule(name+"{"+rules+"}",0);
  }


  document.getElementById("title").innerText = 2048*(8**(self.size-4))


  var scale = 4/self.size
  //var board = document.getElementById("game-container")
  for (let i = 0; i < self.size; i++) {
    //row = document.createElement('div')
    for (let j = 0; j < self.size; j++) {
      let x = ((i)*122.5-.5)*scale, y = ((j)*122.5-.5)*scale;
      createClass(`.tile.tile-position-${i+1}-${j+1}`, `
      -webkit-transform: translate(${x}px, ${y}px);
      -moz-transform: translate(${x}px, ${y}px);
      -ms-transform: translate(${x}px, ${y}px);
      transform: translate(${x}px, ${y}px);`)
    }
  }

  createClass('.tile, .tile .tile-inner', ` 
    width: ${108.5*scale}px;
    height: ${108.5*scale}px;
    line-height: ${108.5*scale}px; 
    font-size: ${55*scale}px;
    border-radius: ${3*scale}px;`);
  createClass('.tile-inner.dynamic-tile-128, .tile-inner.dynamic-tile-256, .tile-inner.dynamic-tile-512', ` 
    font-size: ${45*scale}px;`)
  createClass('.tile-inner.dynamic-tile-1024, .tile-inner.dynamic-tile-2048', ` 
    font-size: ${35*scale}px;`)
  createClass('.tile-inner.dynamic-tile-super', ` 
    font-size: ${30*scale}px;`)

  createClass('.game-container.dynamic-game-container', ` 
    padding: ${15*scale}px`)
  
  createClass('.grid-cell.dynamic-grid-cell', ` 
  margin-right: ${15*scale}px;
  width: ${107.5*scale}px;
  height: ${107.5*scale}px;
  border-radius:${3*scale}px`)
  createClass('.grid-cell.dynamic-grid-cell:last-child',`margin-right: 0;`)


  createClass('.grid-row.dynamic-grid-row', `margin-bottom: ${15*scale}px;`)
  createClass('.grid-row.dynamic-grid-row:last-child', `margin-bottom: 0;`)

  var grid = document.getElementById("grid-container")
  grid.innerHTML = `<div class="grid-row dynamic-grid-row">${'<div class="grid-cell dynamic-grid-cell"></div>'.repeat(self.size)}</div>`.repeat(self.size)

  document.getElementById("game-container").style.width = `${(122.5*self.size+15)*scale}px`
  document.getElementById("game-container").style.height = `${(122.5*self.size+15)*scale}px`
  document.getElementById("game-container").style.borderRadius = `${6*scale}px`
}


// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }
  generateBoard(this);
  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = 2;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore(this.size) < this.score) {
    this.storageManager.setBestScore(this.size, this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(this.size),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value + next.value);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    //for (let i = 0; i < 16; i++) {
      this.addRandomTile();

    //}

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
