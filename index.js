const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(5555);

let games = [];

const createGame = () => {
  return {
    id: parseInt(Math.random() * 100000),
    inProgress: false,
    field: Array(3).fill('').map(a => Array(3).fill('')),
    player: 'X',
    gameover: false,
    moves: 0,
    winner: null
  }
}

io.on('connection', function (socket) {
  socket.emit('games', games.filter(game => !game.inProgress));

  socket.on('create game', function() {
    games.push(createGame());
    socket.emit('games', games);
  })

  socket.on('join game', function(gameId) {
    let game = games.find((game) => {
      if(game.id === gameId) {
        game.inProgress = true;
        return game;
      }
    });
    socket.emit('joined a game', game);
    socket.emit('games', games.filter(game => !game.inProgress));
  })
});