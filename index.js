var express = require('express');
var path = require('path');
var compress = require('compression');

var app = express();

app.use(compress());

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname, '/assets'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = {};
var clientPlayers = {};
var maxPlayers = 3;

io.on('connection', function(socket) {
  clients[socket.id] = null;

  socket.on('join', function(data) {
    var players = Object.keys(io.sockets.sockets).length;
    clientPlayers[socket.id] = players;
    console.log(clientPlayers);
    console.log('client ' + socket.id + ' connected ' + ' (' + players + '/' + maxPlayers + ')');
    io.emit('joined', {
      playersCount: players
    });
  });

  socket.on('gameUpdate', function(data) {
    //delete data.socketId;
    console.log(data);
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