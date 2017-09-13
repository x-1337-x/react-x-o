const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(process.env.PORT || 5555);

app.use(express.static(path.join(__dirname + '/build')));

app.get('/', function (req, res) {
  res.sendfile(__dirname + './build/index.html');
});

let games = [];

Object.prototype.getKeyByValue = function( value ) {
    for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
             if( this[ prop ] === value )
                 return prop;
        }
    }
}

const createGame = () => {
  return {
    id: parseInt(Math.random() * 100000),
    playerIds: [],
    X: null,
    O: null,
    field: Array(3).fill('').map(a => Array(3).fill('')),
    turn: Math.random() > 0.5 ? 'X' : 'O',
    gameover: false,
    moves: 0,
    winner: null
  }
}

const findGame = gameId => games.find(game => game.id === gameId);


const checkLine = (x, y, x1, y1, x2, y2, field) => {
  let f = field;
  if(f[x][y] === '' || f[x1][y1] === '' || f[x2][y2] === '') return false;
  return (f[x][y] === f[x1][y1] && f[x1][y1] === f[x2][y2] ? f[x1][y1] : false);
}

const validateGame = (game) => {
  let field = game.field;
  let winner = 
  //check horizontally
    checkLine(0,0,0,1,0,2,field) ||
    checkLine(1,0,1,1,1,2,field) ||
    checkLine(2,0,2,1,2,2,field) ||
  //check vaertically
    checkLine(0,0,1,0,2,0,field) ||
    checkLine(0,1,1,1,2,1,field) ||
    checkLine(0,2,1,2,2,2,field) ||
  //check diagonally
    checkLine(0,0,1,1,2,2,field) ||
    checkLine(0,2,1,1,2,0,field);

  console.log(winner)

  if(winner !== false) { 
    game.gameover = true,
    game.winner = winner
  };

  return game;
}

io.on('connection', function (socket) {
  socket.emit('games', games.filter(game => game.playerIds.length < 2));

  socket.on('create game', function() {
    games.push(createGame());
    io.emit('games', games.filter(game => game.playerIds.length < 2));
  })

  socket.on('join game', function(data) {
    let game = findGame(data.gameId);
    if (game) {
      game.playerIds.push(data.socketId);
      if(game.X === null) {
        game.X = data.socketId;
      } else {
        game.O = data.socketId;
      };
      let mark = game.getKeyByValue(data.socketId);
      socket.emit('joined a game', {game, mark});
      for(let i in game.playerIds) {
        io.to(game.playerIds[i]).emit('game', game)
      };
      io.emit('games', games.filter(game => game.playerIds.length < 2));
    }
  })

  socket.on('place mark', function(data) {
    let game = findGame(data.gameId);
    if (game) {
      game.field[data.y][data.x] = game.turn;
      game.turn = game.turn === 'X' ? 'O' : 'X';
      game.moves++;
      game.gameover = (game.moves === 9);
      if (game.moves > 3) game = validateGame(game);
      io.to(game.playerIds[0]).emit('game', game);
      io.to(game.playerIds[1]).emit('game', game);
    };
      console.log(games)
  });

  socket.on('reset game', function(gameId) {
    let game = findGame(gameId);
    if (game) {
      console.log('Resetting....')
      game.field = Array(3).fill('').map(a => Array(3).fill(''));
      game.turn = Math.random() > 0.5 ? 'X' : 'O';
      game.gameover = false;
      game.moves = 0;
      game.winner = null;
      io.to(game.playerIds[0]).emit('game', game);
      io.to(game.playerIds[1]).emit('game', game);
    };
  });

});

