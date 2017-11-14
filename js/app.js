/* global ctx */
/* global Resources */
/* global Effects */

const MAX_LIVES = 3;
const MAX_ENEMIES = 3;
const MAX_COLLECTABLES = 3;
const ENEMY_SPEED_MIN = 1;
const ENEMY_SPEED_MAX = 5;
const POINTS_WATER = 50;
const POINTS_COLLECTABLE = 5;
const POINTS_ENEMY_HIT = -5;
const ROWS = 6;
const COLS = 5;
const ROW_OUTSIDE = -23;
const COL_WIDTH = 101;
const ROW_HEIGHT = 83;
const topScores = [];
let GRID;

// init player to prevent errors on console output on very first game load.
let player = {
  handleInput() {},
  update() {},
  render() {},
};
const allEnemies = [];
const allCollectables = [];

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
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

/**
 * @description Return randomly generated number including min/max value.
 * @param {min} The minimum value.
 * @param {max} The maximum value.
 * @return {number} A number representing the given range. Returns 0, if the range is not valid.
 */
function getRandomInt(min, max) {
  const tmpMin = Math.ceil(min);
  const tmpMax = Math.floor(max);
  // prettier-ignore
  return Math.floor(Math.random() * ((tmpMax - tmpMin) + 1)) + tmpMin;
}

/** Player class. */
class Player {
  constructor(sprite = 'images/char-boy.png') {
    this.sprite = sprite;
    this.points = 0;
    this.lives = MAX_LIVES;
    this.reset();
    this.updateLive(0);
  }

  /*
  * @description Set x,y-coordinates of the player.
  */
  reset() {
    Helper.resetGrid();
    this.col = getRandomInt(0, COLS - 1);
    this.row = ROWS - 1;
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
    GRID[this.row][this.col] = true;
  }

  resetAll() {
    this.points = 0;
    this.lives = MAX_LIVES;
    this.updateScoreBy(0);
    this.updateLive(0);
    this.reset();
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
   * @param {num} The number to update the score by.
   */
  updateScoreBy(num) {
    const tmpPoints = this.points + num;
    this.points = tmpPoints < 0 ? 0 : tmpPoints;
    document.querySelector('#points').textContent = this.points;
  }

  /*
   * @description Update life of the player.
   * @param {num} The number to update the life by.
   */
  updateLive(num) {
    const tmpLives = this.lives + num;
    this.lives = tmpLives < 0 ? 0 : tmpLives;
    this.drawLives();
  }

  /**
   * @description Draw the lives left.
   */
  drawLives() {
    let outerHTML = '';
    if (this.lives === 0) {
      Helper.gameOver();
    } else {
      const heartImg = Resources.get('images/Heart.png');
      heartImg.alt = 'Heart';
      heartImg.width = 20;
      for (let i = 0; i < this.lives; i += 1) {
        outerHTML += heartImg.outerHTML;
      }
    }
    document.getElementById('lives').innerHTML = outerHTML;
  }

  /*
   * @description Handle key input from user, so that the player cannot move off screen.
   * @param {keyValue} The key value. Possible values: 'left', 'up', 'right', 'down'.
   */
  handleInput(keyValue) {
    if (this.lives > 0) {
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
    }
  }
}

/** Collectable our player may collect to earn more points. */
class Collectable {
  constructor(sprite = 'images/Star.png') {
    this.sprite = sprite;
    this.reset();
  }

  /*
   * @description Set x,y coordinates of the collectable.
   */
  reset() {
    this.col = getRandomInt(0, COLS - 1);
    this.row = getRandomInt(0, ROWS - 1);
    this.findNext();
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
  }

  /*
   * @description Find next empty space on grid
   */
  findNext() {
    if (GRID[this.row][this.col]) {
      // check for next free element
      if (this.row === GRID.length - 1) {
        this.row = 0;
      } else if (this.col === GRID[this.row].length - 1) {
        this.row += 1;
        this.col = 0;
      } else {
        this.col += 1;
      }
      this.findNext();
    } else {
      GRID[this.row][this.col] = true;
    }
  }

  /*
   * @description Draw the collectable on the screen.
   */
  render() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }

  checkCollisions() {
    if (this.x === player.x && this.y === player.y) {
      this.x = 0 - COL_WIDTH;
      this.y = ROW_OUTSIDE;

      player.updateScoreBy(POINTS_COLLECTABLE);
    }
  }
}

/** Enemies our player must avoid */
class Enemy {
  constructor() {
    // The image/sprite for our enemies, this uses a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.reset();
  }

  /*
   * @description Set x,y coordinates and speed of the enemy.
   */
  reset() {
    this.col = 0;
    this.row = getRandomInt(1, 3);
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
    this.speed = Helper.getEnemySpeed();
  }

  /*
   * @description Update the enemy's position and check for collisions.
   * @parameter {dt} a time delta between ticks.
   */
  update(dt) {
    // multiply any movement by the dt parameter which will ensure the game
    // runs at the same speed for all computers.
    this.x += COL_WIDTH * dt * this.speed;
    // enemy outside of canvas?
    if (this.x > COLS * COL_WIDTH) {
      this.x = -1 * COL_WIDTH;
    }
    if (this.checkCollisions()) {
      player.reset();
      player.updateScoreBy(POINTS_ENEMY_HIT);
      player.updateLive(-1);
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
    const xSpace = this.x < player.x && this.x + ROW_HEIGHT > player.x;
    const ySpace = this.y === player.y;
    if (xSpace && ySpace) {
      player.reset();
      player.updateScoreBy(POINTS_ENEMY_HIT);
      player.updateLive(-1);
    }
  }

  stopMoving() {
    this.speed = 0;
  }
}

class Helper {
  static init(event) {
    return new Promise((resolve, reject) => {
      const asset = event && event.target.attributes ? event.target.attributes.src.value : null;
      player = new Player(asset);
      for (let i = 0; i < MAX_ENEMIES; i += 1) allEnemies.push(new Enemy());
      for (let i = 0; i < MAX_COLLECTABLES; i += 1) {
        allCollectables.push(new Collectable());
      }
      if (player && allEnemies.length > 0 && allCollectables.length > 0) {
        resolve();
      } else {
        reject(new Error('Error initiating game'));
      }
    });
  }

  static getEnemySpeed() {
    // prettier-ignore
    return (Math.random() * (ENEMY_SPEED_MAX - ENEMY_SPEED_MIN)) + ENEMY_SPEED_MIN;
  }

  /**
   * @description Calculate the X coordinate.
   * @param {x} The value of the X coordinate to calculate.
   * @return {number} A number representing X coordinate multiplied by COL_WIDTH.
   */
  static getXCoordinate(x) {
    return x * COL_WIDTH;
  }

  /**
   * @description Calculate the Y coordinate.
   * @param {y} The value of the Y coordinate to calculate.
   * @return {number} A number representing Y coordinate multiplied by ROW_HEIGHT + ROW_OUTSIDE.
   */
  static getYCoordinate(y) {
    // prettier-ignore
    return (y * ROW_HEIGHT) + ROW_OUTSIDE;
  }

  static gameOver() {
    // sort items by descending order
    topScores.sort((a, b) => b - a);
    // we just need the top 3 scores
    if (topScores.length === 3) {
      let notIn = !topScores.includes(player.points);
      let scoresLess = topScores.filter(elem => player.points > elem);
    }
    topScores.push(player.points);
    // display stats
    Effects.hide('canvas')
      .then(Effects.hide('#scoreTitle'))
      .then(Effects.show('#topScoresTitle'))
      .then(Effects.show('#topPoints'))
      .then(Effects.show('#restartGame'))
      .then(() => {
        Helper.displayStats();
        // stop enemies from moving
        allEnemies.forEach(enemy => enemy.stopMoving());
      })
      .catch(e => console.log(e));
  }

  static displayStats() {
    const topPoints = document.getElementById('topPoints');
    topPoints.innerHTML = '';
    topScores.forEach(elem => {
      const p = document.createElement('p');
      p.textContent = elem;
      topPoints.append(p);
    });
  }

  static restartGame() {
    Effects.hide('#topScoresTitle')
      .then(Effects.hide('#topPoints'))
      .then(Effects.hide('#restartGame'))
      .then(Effects.show('#scoreTitle'))
      .then(Effects.show('canvas'))
      .then(() => {
        Helper.resetGrid();
        player.resetAll();
        allEnemies.forEach(enemy => enemy.reset());
        allCollectables.forEach(collectable => collectable.reset());
      })
      .catch(e => console.log(e));
  }

  static resetGrid() {
    GRID = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(false));
  }
}
