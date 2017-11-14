var SPEED_MAX = 5;
var SPEED_MIN = 1;

var ROWS = 6;
var COLS = 5;
var ROW_OUTSIDE = -23;
var COL_OUTSIDE = -101;
var COL_WIDTH = 101;
var ROW_HEIGHT = 83;

var POINTS_WATER = 50;
var POINTS_COLLECTABLE = 5;
var POINTS_ENEMY_HIT = -5;

var MAX_ENEMIES = 3;
var MAX_LIVES = 3;
var MAX_COLLECTABLES = 3;

var grid = Array(ROWS)
  .fill()
  .map(function() {
    return Array(COLS).fill(false);
  });

/**
 * @description Return randomly generated number including min/max value.
 * @param {min} The minimum value.
 * @param {max} The maximum value.
 * @return {number} A number representing the given range. Returns 0, if the range is not valid.
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @description Calculate the X coordinate.
 * @param {x} The value of the X coordinate to calculate.
 * @return {number} A number representing X coordinate multiplied by COL_WIDTH.
 */
function getXCoordinate(x) {
  return x * COL_WIDTH;
}

/**
 * @description Calculate the Y coordinate.
 * @param {y} The value of the Y coordinate to calculate.
 * @return {number} A number representing Y coordinate multiplied by ROW_HEIGHT + ROW_OUTSIDE.
 */
function getYCoordinate(y) {
  return y * ROW_HEIGHT + ROW_OUTSIDE;
}

/** Enemies our player must avoid */
var Enemy = function() {
  // The image/sprite for our enemies, this uses a helper we've provided to easily load images
  this.sprite = "images/enemy-bug.png";
  this.reset();
};

/*
 * @description Set x,y coordinates and speed of the enemy.
 */
Enemy.prototype.reset = function() {
  this.col = 0;
  this.row = getRandomInt(1, 3);
  this.x = getXCoordinate(this.col);
  this.y = getYCoordinate(this.row);
  this.speed = Math.random() * (SPEED_MAX - SPEED_MIN) + SPEED_MIN;
};

/*
 * @description Update the enemy's position and check for collisions.
 * @parameter {dt} a time delta between ticks.
 */
Enemy.prototype.update = function(dt) {
  // multiply any movement by the dt parameter which will ensure the game runs at the same speed for all computers.
  this.x += COL_WIDTH * dt * this.speed;
  // enemy outside of canvas?
  if (this.x > COLS * COL_WIDTH) {
    this.x = -1 * COL_WIDTH;
  }
  // hit by enemy, so update score, live and reset player
  if (this.checkCollisions()) {
    player.reset();
    player.updateScoreBy(-10);
    player.updateLive(-1);
  }
};

/*
 * @description Draw the enemy on the screen.
 */
Enemy.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/*
 * @description Check for collision with the player.
 */
Enemy.prototype.checkCollisions = function() {
  if (this.x < player.x && this.x + ROW_HEIGHT > player.x) {
    return this.y === player.y;
  }
};

/** Player class. */
var Player = function(asset) {
  // set default asset
  if (asset) {
    this.sprite = asset;
  } else {
    this.sprite = "images/char-boy.png";
  }
  this.points = 0;
  this.lives = MAX_LIVES;
  this.reset();
};

/*
 * @description Set x,y-coordinates of the player.
 */
Player.prototype.reset = function() {
  this.col = getRandomInt(0, COLS - 1);
  this.row = ROWS - 1;
  this.x = getXCoordinate(this.col);
  this.y = getYCoordinate(this.row);
  grid[this.row][this.col] = true;
  this.drawLives();
};

/*
 * @description Updates player position.
 */
Player.prototype.update = function() {
  // top reached: reset player, update score and reset collectables
  if (this.y === ROW_OUTSIDE) {
    this.reset();
    this.updateScoreBy(100);
    allCollectables.forEach(function(collectable) {
      collectable.reset();
    });
  }
};

/*
 * @description Draw the player on the screen.
 */
Player.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/*
 * @description Update score of the player.
 * @param {num} The number to update the score by.
 */
Player.prototype.updateScoreBy = function(num) {
  var tmpPoints = this.points + num;
  this.points = tmpPoints < 0 ? 0 : tmpPoints;
  document.querySelector("#points").textContent = this.points;
};

/*
 * @description Update life of the player.
 * @param {num} The number to update the life by.
 */
Player.prototype.updateLive = function(num) {
  var tmpLives = this.lives + num;
  this.lives = tmpLives < 0 ? 0 : tmpLives;
  this.drawLives();
};

/**
 * @description Draw the lives left.
 */
Player.prototype.drawLives = function() {
  var heartImg = Resources.get("images/Heart.png");
  heartImg.alt = "Heart";
  heartImg.width = 20;
  var outerHTML = "";
  for (var i = 0; i < this.lives; i++) {
    outerHTML += heartImg.outerHTML;
  }

  document.getElementById("lives").innerHTML = outerHTML;
};

/*
 * @description Handle key input from user, so that the player cannot move off screen.
 * @param {keyValue} The key value. Possible values: 'left', 'up', 'right', 'down'.
 */
Player.prototype.handleInput = function(keyValue) {
  switch (keyValue) {
    case "left":
      if (this.x >= COL_WIDTH) this.x -= COL_WIDTH;
      break;
    case "up":
      if (this.y >= ROW_OUTSIDE) this.y -= ROW_HEIGHT;
      break;
    case "right":
      if (this.x <= 3 * COL_WIDTH) this.x += COL_WIDTH;
      break;
    case "down":
      if (this.y <= 4 * ROW_HEIGHT) this.y += ROW_HEIGHT;
  }
};

/** Collectable our player may collect to earn more points. */
var Collectable = function(asset) {
  if (asset) {
    this.sprite = asset;
  } else {
    this.sprite = "images/Star.png";
  }
  this.reset();
};

/*
 * @description Set x,y coordinates of the collectable.
 */
Collectable.prototype.reset = function() {
  this.col = getRandomInt(0, COLS - 1);
  this.row = getRandomInt(0, ROWS - 1);
  this.findNext();
  this.x = getXCoordinate(this.col);
  this.y = getYCoordinate(this.row);
};

/*
 * @description Find next empty space on grid
 */
Collectable.prototype.findNext = function() {
  if (grid[this.row][this.col]) {
    // check for next free element
    if (this.row === grid.length - 1) {
      this.row = 0;
    } else if (this.col === grid[this.row].length - 1) {
      this.row++;
      this.col = 0;
    } else {
      this.col++;
    }
    this.findNext();
  } else {
    grid[this.row][this.col] = true;
  }
};

/*
 * @description Update the collectable's position and check for collisions.
 */
Collectable.prototype.update = function() {
  // check for collisions
  if (this.checkCollisions()) {
    this.x = COL_OUTSIDE;
    this.y = ROW_OUTSIDE;

    player.updateScoreBy(25);
  }
};

/*
 * @description Draw the collectable on the screen.
 */
Collectable.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Collectable.prototype.checkCollisions = function() {
  return this.x === player.x && this.y === player.y;
};

// init vars to prevent errors on console output on window load.
var allEnemies = [];
var player = {
  handleInput: function() {},
  update: function() {},
  render: function() {}
};
var allCollectables = [];

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener("keyup", function(e) {
  var allowedKeys = {
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    72: "left", // vim left 'h'
    74: "down", // vim down 'j'
    75: "up", // vim up 'k'
    76: "right" // vim right 'l'
  };

  player.handleInput(allowedKeys[e.keyCode]);
});
