window.onload = function() {
  var game = new Game();
  var socket = game.getSocket();

  socket.emit('join', function(data) {
    game.sync({
      playersCount: parseInt(data.playersCount)
    });
  });

  socket.on('joined', function(data) {
    socket.id = data.socketId;

    data.playersCount = parseInt(data.playersCount);
    game.sync({
      playersCount: parseInt(data.playersCount)
    });
  });
};

function Game() {

  var socket = io();

  var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example');

  var map;
  var tileset;
  var layer;
  var player;
  var facing = 'left';
  var jumpTimer = 0;
  var cursors;
  var jumpButton;
  var bg;
  var currentPlayer = game.rnd.integerInRange(100, 250);
  var master = false;
  var moveFactor = 3;
  var guys = [];
  var totalPlayers;

  var GameState = {

    init: function(data) {
      currentPlayer = data.player;
      var self = this;

      socket.on('clientUpdate', function(data) {
        self.updateClient(data);
      });

      console.log('totalPlayers ' + totalPlayers);
      console.log('currentPlayer ' + currentPlayer);
    },

    preload: function() {
      game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
      game.load.image('tiles-1', 'assets/games/starstruck/tiles-1.png');
      game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
      game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
      game.load.image('starSmall', 'assets/games/starstruck/star.png');
      game.load.image('starBig', 'assets/games/starstruck/star2.png');
      game.load.image('background', 'assets/games/starstruck/background2.png');
    },

    create: function(game) {

      game.physics.startSystem(Phaser.Physics.ARCADE);

      game.stage.backgroundColor = '#000000';

      bg = game.add.tileSprite(0, 0, 800, 600, 'background');
      bg.fixedToCamera = true;

      map = game.add.tilemap('level1');

      map.addTilesetImage('tiles-1');

      game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

      map.setCollisionByExclusion([13, 14, 15, 16, 46, 47, 48, 49, 50, 51]);

      layer = map.createLayer('Tile Layer 1');

      //  Un-comment this on to see the collision tiles
      // layer.debug = true;

      layer.resizeWorld();

      game.physics.arcade.gravity.y = 250;

      for (var i = 0; i < totalPlayers; i++) {

        var guy = game.add.sprite(60 * i + 30, 60 * i + 30, 'dude');

        game.physics.enable(guy, Phaser.Physics.ARCADE);
        guy.body.bounce.y = 0.2;
        guy.body.collideWorldBounds = true;
        guy.body.setSize(20, 32, 5, 16);

        guy.animations.add('left', [0, 1, 2, 3], 10, true);
        guy.animations.add('turn', [4], 20, true);
        guy.animations.add('right', [5, 6, 7, 8], 10, true);


        guys.push(guy);
        console.log("hooray " + i);
      };

      game.camera.follow(guys[currentPlayer]);

      jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      game.input.onDown.add(gofull, this);

      function gofull() {
        if (game.scale.isFullScreen) {
          game.scale.stopFullScreen();
        } else {
          game.scale.startFullScreen(false);
        }
      }

    },

    update: function(data) {

      for (var guy in guys) {
        game.physics.arcade.collide(guys[guy], layer);
      }

      if (cursors.left.isDown) {
        guys[currentPlayer].body.velocity.x = -150;

        if (facing != 'left') {
          guys[currentPlayer].animations.play('left');
          facing = 'left';
        }
      } else if (cursors.right.isDown) {
        guys[currentPlayer].body.velocity.x = 150;

        if (facing != 'right') {
          guys[currentPlayer].animations.play('right');
          facing = 'right';
        }
      } else {
        if (facing != 'idle') {
          guys[currentPlayer].animations.stop();

          if (facing == 'left') {
            guys[currentPlayer].frame = 0;
          } else {
            guys[currentPlayer].frame = 5;
          }

          facing = 'idle';
        }
      }

      if (jumpButton.isDown && game.time.now > jumpTimer) {
        guys[currentPlayer].body.velocity.y = -70;
        jumpTimer = game.time.now + 50;
      }

      this.updateServer();
    },

    render: function() {
      // game.debug.text(game.time.physicsElapsed, 32, 32);
      game.debug.body(guys[currentPlayer]);
      game.debug.bodyInfo(guys[currentPlayer], 16, 24);
    },


    updateServer: function() {

      var data = {
        socketId: 1
      };

      data['socketId'] = socket.id;
      data['player'] = parseInt(currentPlayer);

      data['posx'] = parseFloat(guys[currentPlayer].body.velocity.x);
      data['posy'] = parseFloat(guys[currentPlayer].body.velocity.y);

      socket.emit('gameUpdate', data);
    },

    updateClient: function(data) {
      for (var i in data) {
        if (currentPlayer != data.player) {
          guys[data.player].body.velocity.x = parseFloat(data.posx);
          guys[data.player].body.velocity.y = parseFloat(data.posy);
        }
      }
    },

  };

  var SynchState = {
    p: false,
    players: 0,
    countdown: false,
    init: function(data) {
      var self = this;
      console.log('data ' + data.playersCount);
      totalPlayers = parseInt(data.playersCount);
      self.players = parseInt(data.playersCount);
      self.p = data.playersCount - 1;

      socket.on('joined', function(data) {
        currentPlayer = parseInt(data.playersCount);
        self.players = parseInt(data.playersCount);
      });
    },
    preload: function() {
      cursors = game.input.keyboard.createCursorKeys();
    },
    create: function() {

    },
    update: function() {
      this.initGame(2);
    },
    initGame: function(phase) {
      switch (phase) {
        case 1:
          for (var i in paddles) {
            paddles[i].position.setTo(paddles[i].op.x, paddles[i].op.y);
          }
          this.text.text = "GO!";
        case 2:
          game.state.start("game", false, false, {
            player: this.p
          });
          socket.removeAllListeners('joined');
          socket.removeAllListeners('timeOut');
          socket.removeAllListeners('playerLeft');
          break;
      }
    }
  };

  game.state.add("sync", SynchState, false);
  game.state.add("game", GameState, false);

  this.switchToSync = function(data) {
    game.state.start("sync", false, false, data);
  };

  this.getSocket = function() {
    return socket;
  };

  return this;
}

Game.prototype.getSocket = function() {
  return this.getSocket();
};
Game.prototype.sync = function(data) {
  this.switchToSync(data);
};