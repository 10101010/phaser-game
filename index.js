var express = require('express');
var path = require('path');
var compress = require('compression');
var _ = require('underscore');

var app = express();

app.use(compress());

var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('.'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = {};
var clientPlayers = {};

server.lastPlayderID = 0; // Keep track of the last id assigned to a new player

io.on('connection', function(socket) {
  clients[socket.id] = null;

  socket.on('join', function(data) {
    var playerNum = server.lastPlayderID++;

    clientPlayers[socket.id] = playerNum;

    console.log(clientPlayers);
    console.log('client ' + socket.id + ' connected ' + ' (' + playerNum + ')');

    io.emit('joined', {
      playersCount: Object.keys(clientPlayers).length ,
      clientPlayers: clientPlayers,
      socketId: socket.id
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(reason, socket.id);
    delete clientPlayers[socket.id];
    io.emit('disconnect', socket.id);
    console.log('players', clientPlayers);
  });

  socket.on('gameUpdate', function(data) {
    //delete data.socketId;
    // console.log(data);
    io.emit('clientUpdate', data);
  });

});

server.listen(3000, function() {
  console.log('listening on *:3000');
});

function getSocket(socketId) {
  console.log(io.sockets.connected[socketId]);
  return io.sockets.connected[socketId];
}