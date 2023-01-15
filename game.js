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
      playersCount: parseInt(data.playersCount),
      clientPlayers: data.clientPlayers
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
  var syncTimer = 0;
  var cursors;
  var jumpButton;
  var bg;
  var currentPlayer = 0;//game.rnd.integerInRange(100, 250);
  var clientPlayers = {}
  var master = false;
  var moveFactor = 3;
  var guys = {};
  var totalPlayers;

  var GameState = {

    init: function(data) {
      currentPlayer = data.player;
      clientPlayers = data.clientPlayers;

      var self = this;

      console.log('totalPlayers ' + totalPlayers);
      console.log('currentPlayer ' + currentPlayer);
    },

    preload: function() {
      game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
      game.load.image('tiles-1', 'assets/games/starstruck/tiles-1.png');
      game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
      game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
      game.load.spritesheet('mario', 'assets/games/starstruck/mario.png', 16, 21)
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

      game.physics.arcade.gravity.y = 1000;

      var guy = game.add.sprite(60, 60, 'mario');

      game.physics.enable(guy, Phaser.Physics.ARCADE);
      
      guy.body.bounce.y = 0.01;
      guy.body.bounce.x = 0.01;
      
      guy.body.collideWorldBounds = true;
      guy.body.setSize(16, 21, 0, 0);

      guy.animations.add('right', [0, 1, 2, 3], 30, true);
      guy.animations.add('turn', [7], 30, true);
      guy.animations.add('left', [7, 6, 4, 5], 30, true);

      guy.body.checkCollision.left = true;
      guy.body.checkCollision.right = true;

      game.camera.follow(guy);

      guys[socket.id] = guy;

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
      socket.on('joined', function(data) {
        clientPlayers = data.clientPlayers;
      });

      for (var player in clientPlayers) {
        if (player != socket.id && !guys.hasOwnProperty(player)) {
          var guy = game.add.sprite(60 + 30, 60 + 30, 'mario');

          game.physics.enable(guy, Phaser.Physics.ARCADE);

          guy.body.bounce.y = 0.01;
          guy.body.bounce.x = 0.01;

          // guy.body.collideWorldBounds = false;
          guy.body.setSize(16, 21, 0, 0);

          guy.body.checkCollision.left = true;
          guy.body.checkCollision.right = true;

          guy.animations.add('right', [0, 1, 2, 3], 30, true);
          guy.animations.add('turn', [7], 30, true);
          guy.animations.add('left', [7, 6, 4, 5], 30, true);

          guys[player] = guy;

        }
      };

      for (var guy in guys) {
        for (var collideGuy in guys) {
          game.physics.arcade.collide(guys[guy], guys[collideGuy]);
        }
        game.physics.arcade.collide(guys[guy], layer);

      }

      socket.on('disconnect', function(socketId) {
        delete guys[socketId];
      })

      socket.on('clientUpdate', function(data) {
        if (socket.id != data.socketId && guys.hasOwnProperty(data.socketId)) {
          guys[data.socketId].body.velocity.x = data.velx;
          guys[data.socketId].body.velocity.y = data.vely;
          guys[data.socketId].animations.play(data.animation);

          if (game.time.now > syncTimer) {
            guys[data.socketId].x = data.posx;
            guys[data.socketId].y = data.posy;
            syncTimer = game.time.now + 1000;
          }    

          if (data.facing == 'idle') {
            guys[data.socketId].animations.stop();
          }
        } 
      });


      if (cursors.left.isUp) {
        guys[socket.id].body.velocity.x = -0;
      } else if (cursors.right.isUp) {
        guys[socket.id].body.velocity.x = 0;
      } ;

      if (cursors.left.isDown) {
        guys[socket.id].body.velocity.x = -100;

        if (facing != 'left') {
          guys[socket.id].animations.play('left');
          facing = 'left';
        }
      } else if (cursors.right.isDown) {
        guys[socket.id].body.velocity.x = 100;

        if (facing != 'right') {
          guys[socket.id].animations.play('right');
          facing = 'right';
        }
      } else {
        if (facing != 'idle') {
          guys[socket.id].animations.stop();

          if (facing == 'left') {
            guys[socket.id].frame = 0;
          } else {
            guys[socket.id].frame = 5;
          }

          facing = 'idle';
        }
      }

      if (jumpButton.isDown && game.time.now > jumpTimer) {
        guys[socket.id].body.velocity.y = -300;
        jumpTimer = game.time.now + 600;
      }

      this.updateServer();
    },

    render: function() {
      // game.debug.text(game.time.physicsElapsed, 32, 32);
      game.debug.body(guys[socket.id]);
      game.debug.bodyInfo(guys[socket.id], 16, 24);
    },


    updateServer: function() {
      var data = {}

      data['socketId'] = socket.id;
      data['player'] = parseInt(socket.id);

      data['velx'] = parseFloat(guys[socket.id].body.velocity.x);
      data['vely'] = parseFloat(guys[socket.id].body.velocity.y);

      data['posx'] = parseFloat(guys[socket.id].body.x);
      data['posy'] = parseFloat(guys[socket.id].body.y);

      data['animation'] = guys[socket.id].animations.currentAnim.name;
      data['facing'] = facing

      socket.emit('gameUpdate', data);
    },

  };

  var SynchState = {
    p: false,
    players: 0,
    countdown: false,
    init: function(data) {
      var self = this;
      // totalPlayers = parseInt(data.playersCount);
      // self.players = parseInt(data.playersCount);

      self.p = data.playersCount - 1;
      self.clientPlayers = data.clientPlayers;

      // socket.on('joined', function(data) {
      //   currentPlayer = parseInt(data.playersCount);
      //   self.players = parseInt(data.playersCount);
      // });
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
          this.text.text = "GO!";
        case 2:
          game.state.start("game", false, false, {
            player: this.p,
            clientPlayers: this.clientPlayers
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
    game.stage.disableVisibilityChange = true;
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
