/* global ctx */
/* global Resources */
/* global Effects */

// define some vars
const MAX_LIVES = 3;
const MAX_ENEMIES = 3;
const MAX_COLLECTABLES = 3;
const ENEMY_SPEED_MIN = 1;
const ENEMY_SPEED_MAX = 4;
const POINTS_WATER = 50;
const POINTS_COLLECTABLE_GEM = 25;
const POINTS_COLLECTABLE_KEY = 15;
const POINTS_COLLECTABLE_STAR = 5;
const POINTS_ENEMY_HIT = -10;
const LEVEL_2_TARGET_POINTS = 400;
const LEVEL_3_TARGET_POINTS = 2 * LEVEL_2_TARGET_POINTS;
const ROWS = 6;
const COLS = 5;
const ROW_OUTSIDE = -23; // empty space at top on all images
const COL_WIDTH = 101; // see engine.js:148
const ROW_HEIGHT = 83; // see engine.js:148
const topScores = []; // array of top scores
let PLAYER_LEVEL = 1; // starting at level 1
let PLAYER_STRIPE; // used to keep the selected stripe at the very beginning of the game on restart
let GRID; // 2-dimensional array, used to place the collectables on the play ground

// init player to prevent errors on console output on very first game load
let player = {
  handleInput() {},
  update() {},
  render() {},
};
const allEnemies = [];
const allCollectables = [];

/*
 * @description Listens for key presses and sends the keys to Player.
 * Possible Keys: Left, Up, Right, Down Arrow & h, j, k, l (VIM-style)
 * @param {e} Event to listen for.
 */
const keyUpListener = e => {
  const allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    72: 'left', // vim left 'h'
    74: 'down', // vim down 'j'
    75: 'up', // vim up 'k'
    76: 'right', // vim right 'l'
  };

  player.handleInput(allowedKeys[e.keyCode]);
};
document.addEventListener('keyup', keyUpListener);

/** Player class. */
class Player {
  constructor(sprite = 'images/char-boy.png') {
    this.sprite = sprite;
    this.points = 0;
    this.lives = MAX_LIVES;
    this.reset();
    this.updateLive(0);
    this.updateScoreBy(0);
  }

  /*
   * @description Set x,y-coordinates of the player.
   */
  reset() {
    this.col = Helper.getRandomInt(0, COLS - 1);
    this.row = ROWS - 1;
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
    Helper.resetGrid();
    Helper.fillGridAt(this.row, this.col);
  }

  /*
   * @description Updates player position.
   */
  update() {
    // top reached: reset player, update score and reset collectables
    if (this.y === ROW_OUTSIDE) {
      this.reset();
      this.updateScoreBy(POINTS_WATER);
      allCollectables.forEach(collectable => collectable.reset());
    }
  }

  /*
   * @description Draw the player on the screen.
   */
  render() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }

  /*
   * @description Update score of the player.
   * @param {num} The number to update the score by. Only integers allowed.
   */
  updateScoreBy(num) {
    if (Number.isInteger(num)) {
      const tmpPoints = this.points + num;
      this.points = tmpPoints < 0 ? 0 : tmpPoints;
      document.querySelector('#points').textContent = this.points;
      Helper.levelUp();
    }
  }

  /*
   * @description Update life of the player.
   * @param {num} The number to update the life by. Only integers allowed.
   */
  updateLive(num) {
    if (Number.isInteger(num)) {
      const tmpLives = this.lives + num;
      this.lives = tmpLives < 0 ? 0 : tmpLives;
      this.drawLives();
    }
  }

  /*
     * @description Update points, life of player and reset to initial state.
     * @param {points} The points to be added.
     * @param {lifeNum} The life to be added.
     */
  updateOnCollision(points, lifeNum) {
    this.updateScoreBy(points);
    this.updateLive(lifeNum);
    this.reset();
  }

  /**
   * @description Draw the lives left.
   */
  drawLives() {
    // let outerHTML = '';
    if (this.lives === MAX_LIVES) {
      // show all
      Effects.show('#lives img', true);
    } else {
      // player lost one live, so hide
      Effects.hide(`#lives img:nth-child(${this.lives + 1})`);
      // game over?
      if (this.lives === 0) Helper.gameOver();
    }
  }

  /*
   * @description Handle key input from user, so that the player cannot move off screen.
   * @param {keyValue} The key value. Possible values: 'left', 'up', 'right', 'down'.
   */
  handleInput(keyValue) {
    if (this.lives > 0) {
      // remove old position on grid
      Helper.clearGridAt(this.row, this.col);
      // handle key input
      switch (keyValue) {
        case 'left':
          if (this.x >= COL_WIDTH) this.x -= COL_WIDTH;
          break;
        case 'up':
          if (this.y >= ROW_OUTSIDE) this.y -= ROW_HEIGHT;
          break;
        case 'right':
          if (this.x <= 3 * COL_WIDTH) this.x += COL_WIDTH;
          break;
        case 'down':
          if (this.y <= 4 * ROW_HEIGHT) this.y += ROW_HEIGHT;
          break;
        default: // do nothing
      }
      // set new position on grid
      Helper.fillGridAt(this.row, this.col);
    }
  }
}

/** Collectable class. Player may collect to earn more points. */
class Collectable {
  constructor(sprite = 'images/Star.png') {
    this.sprite = sprite;
    this.reset();
  }

  /*
   * @description Set x,y coordinates of the collectable
   * and find position on the grid.
   */
  reset() {
    // prettier-ignore
    this.max_positions_on_grid = (ROWS * COLS) - 1;
    this.col = Helper.getRandomInt(0, COLS - 1);
    if (this.sprite.includes('Gem')) {
      this.row = 0;
    } else if (this.sprite.includes('Key')) {
      this.row = Helper.getRandomInt(1, 3);
    } else {
      this.row = Helper.getRandomInt(0, ROWS - 1);
    }
    this.findNext();
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
  }

  /*
   * @description Find next empty space on grid. Empty space means
   * simply that on the desired position there is no collectable or player.
   * If the position is occupied test the next position on the grid, until you find a place.
   * Should all positions be occupied, don't do anything.
   */
  findNext() {
    if (Helper.getValueFromGridAt(this.row, this.col)) {
      // check for next free element
      if (this.row === GRID.length - 1) {
        this.row = 0;
      } else if (this.col === GRID[this.row].length - 1) {
        this.row += 1;
        this.col = 0;
      } else {
        this.col += 1;
      }
      // is there still empty place on the grid?
      if (this.max_positions_on_grid > 0) {
        this.findNext();
      }
    } else {
      Helper.fillGridAt(this.row, this.col);
      this.max_positions_on_grid -= 1;
    }
  }

  /*
   * @description Draw the collectable on the screen.
   */
  render() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }

  /*
   * @description Check for collisions and update players score if necessary.
   */
  checkCollisions() {
    if (this.x === player.x && this.y === player.y) {
      // remove from grid
      GRID[this.row][this.col] = false;
      // place outside of game board
      this.x = 0 - COL_WIDTH;
      this.y = ROW_OUTSIDE;

      // get points
      let pointsEarned = POINTS_COLLECTABLE_STAR;
      if (this.sprite.includes('Key')) pointsEarned = POINTS_COLLECTABLE_KEY;
      if (this.sprite.includes('Gem')) pointsEarned = POINTS_COLLECTABLE_GEM;

      player.updateScoreBy(pointsEarned);
    }
  }
}

/** Enemies our player must avoid */
class Enemy {
  constructor(sprite = 'images/enemy-bug.png') {
    this.sprite = sprite;
    this.reset();
  }

  /*
   * @description Set x,y coordinates and speed of the enemy.
   */
  reset() {
    this.col = 0;
    this.row = Helper.getRandomInt(1, 3);
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
    this.speed = Helper.calculateEnemySpeed();
  }

  /*
   * @description Update the enemy's position.
   * @parameter {dt} a time delta between ticks.
   */
  update(dt) {
    // multiply any movement by the dt parameter which will ensure the game
    // runs at the same speed for all computers.
    if (dt) {
      this.x += COL_WIDTH * dt * this.speed;
      // enemy outside of canvas?
      if (this.x > COLS * COL_WIDTH) {
        this.x = -1 * COL_WIDTH;
      }
    }
  }

  /*
   * @description Draw the enemy on the screen.
   */
  render() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }

  /*
   * @description Check for collision with the player and update score & life.
   */
  checkCollisions() {
    // is the player in the range of the enemy?
    const xPosTolerance = COL_WIDTH / 2;
    const xPos = this.x >= player.x - xPosTolerance && this.x < player.x + xPosTolerance;
    const yPos = this.y === player.y;

    if (xPos && yPos) {
      // reset player, update score & remove one live.
      player.updateOnCollision(POINTS_ENEMY_HIT, -1);
    }
  }

  /*
   * @description Sets speed to zero and stops movement.
   */
  stopMoving() {
    this.speed = 0;
  }

  /*
   * @description Speed up enemy by the given number.
   * @param {num} The number to add to the speed. Only positive integers allowed.
   */
  accelerateBy(num) {
    if (Number.isInteger(num) && num > 0) {
      this.speed += num;
    }
  }
}

/** Helper class to have common actions in one place */
class Helper {
  /*
   * @description Initial game and set player, collectables and enemies initial values.
   */
  static init(event) {
    return new Promise((resolve, reject) => {
      // clear all
      this.clearArray(allEnemies);
      this.clearArray(allCollectables);
      // get player asset
      if (!PLAYER_STRIPE) {
        PLAYER_STRIPE =
          event && event.target.attributes ? event.target.attributes.src.value : undefined;
      }
      // create player
      player = new Player(PLAYER_STRIPE);
      // create enemies
      for (let i = 0; i < MAX_ENEMIES; i += 1) {
        allEnemies.push(new Enemy());
      }
      // create collectables
      for (let i = 0; i < MAX_COLLECTABLES; i += 1) {
        allCollectables.push(new Collectable());
      }
      // resolve if everything is set up else reject
      if (player && allEnemies.length > 0 && allCollectables.length > 0) {
        resolve();
      } else {
        reject(new Error('Error initiating game'));
      }
    });
  }

  /*
   * @description Calculate speed of enemy
   */
  static calculateEnemySpeed() {
    // prettier-ignore
    return (Math.random() * (ENEMY_SPEED_MAX - ENEMY_SPEED_MIN)) + ENEMY_SPEED_MIN;
  }

  /*
   * @description Calculate the X coordinate.
   * @param {x} The value of the X coordinate to calculate.
   * @return {number} A number representing X coordinate multiplied by COL_WIDTH.
   */
  static getXCoordinate(x) {
    return x * COL_WIDTH;
  }

  /*
   * @description Calculate the Y coordinate.
   * @param {y} The value of the Y coordinate to calculate.
   * @return {number} A number representing Y coordinate multiplied by ROW_HEIGHT + ROW_OUTSIDE.
   */
  static getYCoordinate(y) {
    // prettier-ignore
    return (y * ROW_HEIGHT) + ROW_OUTSIDE;
  }

  /*
   * @description Will be invoked on game over to display 'Top Scores' to the user.
   */
  static gameOver() {
    this.descOrderTopScores();
    // display stats
    Effects.remove('canvas')
      .then(Effects.show('#topScores'))
      .then(Effects.show('#restartGame'))
      .then(() => {
        // stop enemies from moving to prevent continious calculation of movement.
        allEnemies.forEach(enemy => enemy.stopMoving());
        Helper.displayTopScores();
      })
      .catch(e => console.error(e)); // eslint-disable-line no-console
  }

  /*
   * @description Create 'Top Scores' statistic.
   */
  static displayTopScores() {
    const topPoints = document.getElementById('topPoints');
    topPoints.innerHTML = '';
    topScores.forEach((elem, idx) => {
      const p = document.createElement('p');
      p.textContent = `${idx + 1}. ${elem} Points`;
      topPoints.append(p);
    });
  }

  /*
   * @description Sort Top Scores in descending order.
   */
  static descOrderTopScores() {
    if (!topScores.includes(player.points)) {
      topScores.push(player.points);
      // sort items by descending order
      topScores.sort((a, b) => b - a);
      if (topScores.length > 3) {
        topScores.pop();
      }
    }
  }

  /*
   * @descripton Restart game which will invoke Helper.init()
   * method to initial a new game.
   */
  static restartGame() {
    Effects.remove('#topScores')
      .then(Effects.remove('#restartGame'))
      .then(Effects.show('canvas'))
      .then(this.init())
      .catch(e => console.error(e)); // eslint-disable-line no-console
  }

  /*
   * @description Reset grid, which is used to place collectables on the game board intelligently.
   */
  static resetGrid() {
    GRID = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(false));
  }

  /*
   * @description Set the value at the given position to true, which
   * indicates an occupied position on the game board.
   * @param {y} The y coordinate.
   * @param {x} The x coordinate.
   * @return {boolean} Return true on success else false.
   */
  static fillGridAt(y, x) {
    if (GRID && GRID.length > y && GRID[y].length > x) {
      GRID[y][x] = true;
      return true;
    }
    return false;
  }

  /*
   * @description Set the value at the given position to false, which
   * indicates an empty space on the game board.
   * @param {y} The y coordinate.
   * @param {x} The x coordinate.
   * @return {boolean} Return true on success else false.
   */
  static clearGridAt(y, x) {
    if (GRID && GRID.length > y && GRID[y].length > x) {
      GRID[y][x] = false;
      return true;
    }
    return false;
  }

  /*
   * @description Get value of the specified position.
   * @param {y} The y coordinate.
   * @param {x} The x coordinate.
   * @return {boolean} Returns true, if only the value is true, else false.
   */
  static getValueFromGridAt(y, x) {
    return GRID && GRID.length > y && GRID[y].length > x ? GRID[y][x] : false;
  }

  /*
   * @description Increase game level, if the user reaches specific points.
   * If the player reaches Level 2 || Level 3, an enemy and collectable will
   * be added extra on the game board accordingly and the enemies will get faster.
   */
  static levelUp() {
    if (player.points < LEVEL_2_TARGET_POINTS) {
      PLAYER_LEVEL = 1;
    }
    if (PLAYER_LEVEL === 1 && player.points >= LEVEL_2_TARGET_POINTS) {
      allEnemies.push(new Enemy());
      allCollectables.push(new Collectable('images/Key.png'));
      allEnemies.forEach(enemy => enemy.accelerateBy(1));
      PLAYER_LEVEL = 2;
    }
    if (PLAYER_LEVEL === 2 && player.points >= LEVEL_3_TARGET_POINTS) {
      allEnemies.push(new Enemy());
      allCollectables.push(new Collectable('images/Gem Blue.png'));
      allEnemies.forEach(enemy => enemy.accelerateBy(2));
      PLAYER_LEVEL = 3;
    }
    document.querySelector('#level').textContent = PLAYER_LEVEL;
  }

  /*
   * @description Clear an array.
   */
  static clearArray(arr) {
    while (arr && arr.length) {
      arr.pop();
    }
  }

  /*
   * @description Return randomly generated number including min/max value.
   * @param {min} The minimum value.
   * @param {max} The maximum value.
   * @return {number} A number representing the given range. Returns 0, if the range is not valid.
   */
  static getRandomInt(min, max) {
    if (Number.isInteger(min) && Number.isInteger(max)) {
      const tmpMin = Math.ceil(min);
      const tmpMax = Math.floor(max);
      // prettier-ignore
      return Math.floor(Math.random() * ((tmpMax - tmpMin) + 1)) + tmpMin;
    }
    return 0;
  }
}
