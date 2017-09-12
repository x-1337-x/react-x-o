const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(5555);

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

const placeMark = (y, x) => {
  let {field, player, moves} = this.state;
  let newField = field.slice();
  newField[y][x] = player;
  this.setState({
    field: newField,
    player: player === 'X' ? 'O' : 'X',
    moves: moves + 1,
    gameover: (moves + 1 === 9)
  });
  if (moves > 3) this.validateGame();
}

const resetGame = () => {
  this.setState({
    field: Array(3).fill('').map(a => Array(3).fill('')),
    player: 'X',
    gameover: false,
    moves: 0,
    winner: null
  })
}

// const checkLine = (x, y, x1, y1, x2, y2) => {
//   let f = this.state.field;
//   if(f[x][y] === '' || f[x1][y1] === '' || f[x2][y2] === '') return false;
//   return (f[x][y] === f[x1][y1] && f[x1][y1] === f[x2][y2] ? f[x1][y1] : false);
// }

// const validateGame = () => {
//   let winner = 
//   //check horizontally
//     this.checkLine(0,0,0,1,0,2) ||
//     this.checkLine(1,0,1,1,1,2) ||
//     this.checkLine(2,0,2,1,2,2) ||
//   //check vaertically
//     this.checkLine(0,0,1,0,2,0) ||
//     this.checkLine(0,1,1,1,2,1) ||
//     this.checkLine(0,2,1,2,2,2) ||
//   //check diagonally
//     this.checkLine(0,0,1,1,2,2) ||
//     this.checkLine(0,2,1,1,2,0);

//   console.log(winner)

//   if(winner !== false) {
//       this.setState({
//       gameover: true,
//       winner: winner
//     });
//   }
// }

io.on('connection', function (socket) {
  socket.emit('games', games.filter(game => game.playerIds.length < 2));

  socket.on('create game', function() {
    games.push(createGame());
    io.emit('games', games);
  })

  socket.on('join game', function(data) {
    let game = games.find(game => game.id === data.gameId);
    if (game) {
      game.playerIds.push(data.socketId);
      if(game.X === null) {
        game.X = data.socketId;
      } else {
        game.O = data.socketId;
      };
      let mark = game.getKeyByValue(data.socketId);
      console.log(mark)
      socket.emit('joined a game', {game, mark});
      for(let i in game.playerIds) {
        io.to(game.playerIds[i]).emit('game', game)
      }
      io.emit('games', games.filter(game => game.playerIds.length < 2));
    }
  })

  socket.on('place mark', function(data) {
        console.log(games)
    let game = games.find(game => game.id === data.gameId);
        console.log(data)
    if (game) {
      game.field[data.y][data.x] = game.turn;
      game.turn = game.turn === 'X' ? 'O' : 'X';
      game.moves++;
      game.gameover = (game.moves + 1 === 9);
      io.to(game.playerIds[0]).emit('game', game);
      io.to(game.playerIds[1]).emit('game', game);
    };
  });
});

