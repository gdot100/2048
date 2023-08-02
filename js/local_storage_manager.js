window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey     = "bestScore_jRHVLnjYR0fSL7BKMnxx1PT0ktdPLO05";
  this.gameStateKey     = "gameState_jRHVLnjYR0fSL7BKMnxx1PT0ktdPLO05";
  this.size             = "size_jRHVLnjYR0fSL7BKMnxx1PT0ktdPLO05";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";

  try {
    var storage = window.localStorage;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function (size) {
  return (JSON.parse(this.storage.getItem(this.bestScoreKey)) || {})[size] || 0;
};

LocalStorageManager.prototype.setBestScore = function (size, score) {
  var records = JSON.parse(this.storage.getItem(this.bestScoreKey)) || {};
  records[size] = score;
  this.storage.setItem(this.bestScoreKey, JSON.stringify(records));
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function () {
  var stateJSON = this.storage.getItem(this.gameStateKey);
  return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function (gameState) {
  this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function () {
  this.storage.removeItem(this.gameStateKey);
};

LocalStorageManager.prototype.setSize = function (size) {
  this.storage.setItem(this.size, JSON.stringify(size));
};

LocalStorageManager.prototype.getSize = function () {
  return parseInt(this.storage.getItem(this.size))
};
