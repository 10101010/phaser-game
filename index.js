var express = require('express');
var path = require('path');
var compress = require('compression');
var _ = require('underscore');

var app = express();

app.use(compress());

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('.'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = {};
var clientPlayers = [];
var maxPlayers = 3;

io.on('connection', function(socket) {
  clients[socket.id] = null;

  socket.on('join', function(data) {
    var playerNum = Object.keys(io.sockets.sockets).length;

    console.log('cp', Math.max(_.values(clientPlayers)))
    clientPlayers[socket.id] = playerNum;
    console.log(clientPlayers);
    console.log('client ' + socket.id + ' connected ' + ' (' + playerNum + '/' + maxPlayers + ')');
    io.emit('joined', {
      playersCount: playerNum,
      clientPlayers: clientPlayers,
      socketId: socket.id
    });

    socket.on("disconnect", (reason) => {
      delete clientPlayers[socket.id]
    });
  });

  socket.on('gameUpdate', function(data) {
    //delete data.socketId;
    //console.log(data);
    io.emit('clientUpdate', data);
  });

});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

function getSocket(socketId) {
  console.log(io.sockets.connected[socketId]);
  return io.sockets.connected[socketId];
}