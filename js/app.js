/* global ctx */
/* global Resources */
/* global Effects */

const MAX_LIVES = 3;
const MAX_ENEMIES = 3;
const MAX_COLLECTABLES = 3;
const ENEMY_SPEED_MIN = 1;
const ENEMY_SPEED_MAX = 4;
const POINTS_WATER = 50;
const POINTS_COLLECTABLE_STAR = 5;
const POINTS_COLLECTABLE_KEY = 15;
const POINTS_COLLECTABLE_GEM = 25;
const POINTS_ENEMY_HIT = -5;
const POINTS_LEVEL_2 = 400;
const POINTS_LEVEL_3 = 800;
const ROWS = 6;
const COLS = 5;
const ROW_OUTSIDE = -23;
const COL_WIDTH = 101;
const ROW_HEIGHT = 83;
const topScores = [];
let PLAYER_LEVEL = 1;
let PLAYER_STRIPE;
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
    GRID[this.row][this.col] = true;
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
    Helper.levelUp();
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
    // let outerHTML = '';
    if (this.lives === MAX_LIVES) {
      // show all
      Effects.show('#lives img', true);
    } else {
      Effects.hide(`#lives img:nth-child(${this.lives + 1})`);
      if (this.lives === 0) Helper.gameOver();
    }
    // const heartImg = Resources.get('images/Heart.png');
    // heartImg.alt = 'Heart';
    // heartImg.width = 24;
    // for (let i = 0; i < this.lives; i += 1) {
    // outerHTML += heartImg.outerHTML;
    // }
    // }
    // document.getElementById('lives').innerHTML = outerHTML;
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
    // prettier-ignore
    this.max_positions = (ROWS * COLS) - 1;
    this.reset();
  }

  /*
   * @description Set x,y coordinates of the collectable.
   */
  reset() {
    this.col = Helper.getRandomInt(0, COLS - 1);
    this.row = Helper.getRandomInt(0, ROWS - 1);
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
      if (this.max_positions > 0) {
        this.findNext();
      }
    } else {
      GRID[this.row][this.col] = true;
      this.max_positions -= 1;
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

      let pointsEarned = POINTS_COLLECTABLE_STAR;
      if (this.sprite.includes('Key')) {
        pointsEarned = POINTS_COLLECTABLE_KEY;
      }
      if (this.sprite.includes('Gem')) {
        pointsEarned = POINTS_COLLECTABLE_GEM;
      }
      player.updateScoreBy(pointsEarned);
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
    this.row = Helper.getRandomInt(1, 3);
    this.x = Helper.getXCoordinate(this.col);
    this.y = Helper.getYCoordinate(this.row);
    this.speed = Helper.calculateEnemySpeed();
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

  speedUpBy(num) {
    this.speed += num;
  }
}

class Helper {
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
      // create game objects
      player = new Player(PLAYER_STRIPE);
      for (let i = 0; i < MAX_ENEMIES; i += 1) {
        allEnemies.push(new Enemy());
      }
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

  static calculateEnemySpeed() {
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
    this.reOrderTopScores();
    // display stats
    Effects.remove('canvas')
      .then(Effects.show('#topScores'))
      .then(Effects.show('#restartGame'))
      .then(() => {
        // stop enemies from moving
        allEnemies.forEach(enemy => enemy.stopMoving());
        Helper.displayStats();
      })
      .catch(e => console.error(e));
  }

  static displayStats() {
    const topPoints = document.getElementById('topPoints');
    topPoints.innerHTML = '';
    topScores.forEach((elem, idx) => {
      const p = document.createElement('p');
      p.textContent = `${idx + 1}. ${elem} Points`;
      topPoints.append(p);
    });
  }

  static reOrderTopScores() {
    if (!topScores.includes(player.points)) {
      topScores.push(player.points);
      // sort items by descending order
      topScores.sort((a, b) => b - a);
      if (topScores.length > 3) {
        topScores.pop();
      }
    }
  }

  static restartGame() {
    Effects.remove('#topScores')
      .then(Effects.remove('#restartGame'))
      .then(Effects.show('canvas'))
      .then(this.init())
      .catch(e => console.error(e));
  }

  static resetGrid() {
    GRID = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(false));
  }

  static levelUp() {
    if (player.points < POINTS_LEVEL_2) {
      PLAYER_LEVEL = 1;
    }
    if (PLAYER_LEVEL === 1 && player.points >= POINTS_LEVEL_2) {
      allEnemies.push(new Enemy());
      allCollectables.push(new Collectable('images/Key.png'));
      allEnemies.forEach(enemy => enemy.speedUpBy(1));
      PLAYER_LEVEL = 2;
    }
    if (PLAYER_LEVEL === 2 && player.points >= POINTS_LEVEL_3) {
      allEnemies.push(new Enemy());
      allCollectables.push(new Collectable('images/Gem Blue.png'));
      allEnemies.forEach(enemy => enemy.speedUpBy(2));
      PLAYER_LEVEL = 3;
    }
    document.querySelector('#level').textContent = PLAYER_LEVEL;
  }

  static clearArray(arr) {
    while (arr && arr.length) {
      arr.pop();
    }
  }

  /**
   * @description Return randomly generated number including min/max value.
   * @param {min} The minimum value.
   * @param {max} The maximum value.
   * @return {number} A number representing the given range. Returns 0, if the range is not valid.
   */
  static getRandomInt(min, max) {
    const tmpMin = Math.ceil(min);
    const tmpMax = Math.floor(max);
    // prettier-ignore
    return Math.floor(Math.random() * ((tmpMax - tmpMin) + 1)) + tmpMin;
  }
}
