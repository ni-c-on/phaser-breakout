var handlers = { preload: preload, create: create, update: update };
var game = new Phaser.Game(949, 534, Phaser.AUTO, '', handlers);

var initialSpeed = 420,
    speed = initialSpeed,
    speedIncreaseTimeout = 10000,
    speedIncreas = 35,
    nextSpeedIncrease;

var bar,
    ball,
    emitter,
    bricks,
    scoreLabel,
    livesLabel,
    infoLabel;

var ballReleased = false;

var score = 0,
    lives = 3;

var rnd;

var sounds = {
  background: undefined,
  wall: undefined,
  brick: undefined,
  bar: undefined
};

function preload() {
  game.load.image('background', 'images/space.jpg');
  game.load.image('ball', 'images/ball.png');
  game.load.image('brick', 'images/brick.png');
  game.load.image('glow', 'images/glow.png');
  game.load.image('bar', 'images/bar.png');
  game.load.audio('sound_bg', 'sounds/destiny-electro-pop-loop.mp3');
  game.load.audio('sound_wall', 'sounds/ball-hit-wall.wav');
  game.load.audio('sound_brick', 'sounds/ball-hit-brick.wav');
  game.load.audio('sound_bar', 'sounds/ball-hit-bar.wav');
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.checkCollision.down = false;

  game.add.tileSprite(0, 0, 949, 534, 'background');

  infoLabel = game.add.text(game.world.centerX, game.world.centerY + 40, 'Please wait...', { fontSize: '16px', fill: '#fff' });
  infoLabel.anchor.setTo(0.5);
  infoLabel.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

  sounds.background = game.add.audio('sound_bg');
  sounds.wall = game.add.audio('sound_wall');
  sounds.wall.volume = .9;
  sounds.brick = game.add.audio('sound_brick');
  sounds.bar = game.add.audio('sound_bar');
  sounds.bar.volume = .4;

  game.sound.setDecodedCallback(sounds, start, this);
}

function start() {
  sounds.background.loopFull(0.5);

  game.add.tween(infoLabel).to({ alpha: 0}, 200, Phaser.Easing.Quartic.Out, true);

  emitter = game.add.emitter(game.world.centerX, game.world.centerY, 20);
  emitter.makeParticles('glow');
  emitter.gravity = 0;
  emitter.setAlpha(.8, 0, 200);
  emitter.setScale(1, 0, 0.8, 0, 3000);
  emitter.start(false, 50, 3);

  bar = game.add.sprite(game.world.centerX, game.world.height - 20, 'bar');
  bar.anchor.setTo(0.5, 0.5);
  game.physics.arcade.enable(bar);
  bar.body.immovable = true;

  ball = game.add.sprite(0, 0, 'ball');
  ball.anchor.setTo(0.5, 0.5);
  ball.scale.setTo(0.7, 0.7);
  ball.checkWorldBounds = true;

  game.physics.arcade.enable(ball);

  rnd = getRnd();
  ball.y = bar.y - bar.height / 2 - ball.height / 2;

  ball.body.collideWorldBounds = true;
  ball.body.bounce.setTo(1, 1);

  ball.events.onOutOfBounds.add(ballLost, this);

  ball.body.onWorldBounds = new Phaser.Signal();
  ball.body.onWorldBounds.add(function () {
    sounds.wall.play();
  }, this);

  bricks = game.add.group();
  bricks.enableBody = true;

  var brickWidth = 48 + 4;
  var brickHeight = 24 + 4;
  var count = Math.round(game.world.width / brickWidth);
  var offset = Math.round((game.world.width - brickWidth * count) / 2);

  for (var i = 0; i < 7; i++) {
    for (var j = (i == 0 ? 1 : i); j < count - (i == 0 ? 1 : i); j++) {
      var brick = bricks.create(j * brickWidth + 9, i * brickHeight + 60, 'brick');
      brick.body.immovable = true;
    }
  }

  scoreLabel = game.add.text(50, 16, 'Score: 0', { fontSize: '16px', fill: '#fff' });
  scoreLabel.anchor.setTo(0.5);
  scoreLabel.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

  livesLabel = game.add.text(game.world.width - 16, 16, 'Lives: ' + lives, { fontSize: '16px', fill: '#fff', align: 'right' });
  livesLabel.anchor.setTo(1, 0.5);
  livesLabel.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

  game.input.onDown.add(releaseBall, this);
}

function update() {
  emitter.minParticleSpeed.set(0, 0);
  emitter.maxParticleSpeed.set(0, 0);

  emitter.emitX = ball.x;
  emitter.emitY = ball.y;

  bar.x = game.input.x;
  var barHalfWidth = bar.width / 2;
  if (bar.x < barHalfWidth) {
    bar.x = barHalfWidth;
  } else if (bar.x > game.width - barHalfWidth) {
    bar.x = game.width - barHalfWidth;
  }
  if (ballReleased === false) {
    ball.x = bar.x + rnd;
  } else {
    game.physics.arcade.collide(ball, bar, hitBar, null, this);
    game.physics.arcade.collide(ball, bricks, hitBrick, null, this);
  }
}

function getRnd() {
  var o = Math.round(bar.width / 10);
  return game.rnd.integerInRange(-o, o);
}

function releaseBall() {
  if (ballReleased === false) {
    nextSpeedIncrease = game.time.time + speedIncreaseTimeout;
    ballReleased = true;
  }
}

function hitBar(_ball, _bar) {
  sounds.bar.play();

  if (ballReleased && game.time.time > nextSpeedIncrease) {
    speed += speedIncreas;
    nextSpeedIncrease = game.time.time + speedIncreaseTimeout;
  }

  var angle = Math.asin((_ball.x - _bar.x) / (_bar.width  + _ball.width) * 1.8);

  _ball.body.velocity.x = speed * Math.sin(angle);
  _ball.body.velocity.y = -speed * Math.cos(angle);
}

function hitBrick(_ball, _brick) {
  sounds.brick.play();
  score++;
  scoreLabel.text = 'Score: ' + score;
  var tween = game.add.tween(_brick).to({ alpha: 0 }, 150, Phaser.Easing.Linear.none, true);
  tween.onComplete.add(function () {
    _brick.kill();
    // bricks.removeChild(brick);

    if (bricks.countLiving() === 0) {
      score += 100;
      scoreLabel.text = 'Score: ' + score;

      ballReleased = false;
      ball.body.velocity.set(0);
      rnd = getRnd();
      ball.reset(bar.x + rnd, bar.y - bar.height / 2 - ball.height / 2);

      bricks.callAll('revive');
      bricks.forEach(function (_brick) {
        _brick.alpha = 1;
      });
    }
  }, this);
}

function ballLost() {

  lives--;
  livesLabel.text = 'Lives: ' + lives;

  if (lives === 0) {
    gameOver();
  } else {
    ballReleased = false;
    speed = initialSpeed;
    rnd = getRnd();
    ball.reset(bar.x + rnd, bar.y - bar.height / 2 - ball.height / 2);
  }
}

function gameOver() {
  ball.body.velocity.setTo(0, 0);
  game.add.tween(scoreLabel).to({ x: game.world.centerX, y: game.world.centerY, fontSize: '48px' }, 1000, Phaser.Easing.Quartic.Out, true );
  infoLabel.text = 'Game Over';
  game.add.tween(infoLabel).to({ alpha: 1 }, 250, Phaser.Easing.Quartic.Out, true, 1100);
}