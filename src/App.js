import React from 'react';
import io from 'socket.io-client';
import './App.css'

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.socket = io('http://localhost:5555');
    this.socket.on('games', (games) => this.setState({games}));
    this.socket.on('joined a game', (game) => this.setState({game}));
  }

  state = {
    games: null,
    game: null
  }

  render() {
    let {games, game} = this.state;
    return (
      <div className="game">

        <button onClick={this.createGame}>Create A Game</button>
        {games && (
          games.map(game =>
            <div>
              {game.id} <button onClick={this.joinGame.bind(this, game.id)}>JOIN</button>
            </div>
          )
        )}

        {game && !game.gameover && (
          <h1>yippi-ka-yay</h1>
        )}
        {game && game.gameover && (
          <h1>{game.winner === null ? 'DRAW' : `${game.winner} won`}</h1>
        )}
        {game && (<table>
          <tbody>
            {game.field.map((row, y) =>
              <tr key={y}>
                {row.map((col, x) => 
                  <td key={x} onClick={col === '' && !game.winner ? () => this.placeMark(y, x) : null}>
                    {col !== '' ? col : <span>{game.player}</span>}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>)}
        {game && (game.gameover || game.moves === 9) && (
          <div className="reset-game">
            <button onClick={this.resetGame}>Start Over</button>
          </div>
        )}
      </div>
    )
  }

  placeMark = (y, x) => {
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

  resetGame = () => {
    this.setState({
      field: Array(3).fill('').map(a => Array(3).fill('')),
      player: 'X',
      gameover: false,
      moves: 0,
      winner: null
    })
  }

  checkLine = (x, y, x1, y1, x2, y2) => {
    let f = this.state.field;
    if(f[x][y] === '' || f[x1][y1] === '' || f[x2][y2] === '') return false;
    return (f[x][y] === f[x1][y1] && f[x1][y1] === f[x2][y2] ? f[x1][y1] : false);
  }

  validateGame = () => {
    let winner = 
    //check horizontally
      this.checkLine(0,0,0,1,0,2) ||
      this.checkLine(1,0,1,1,1,2) ||
      this.checkLine(2,0,2,1,2,2) ||
    //check vaertically
      this.checkLine(0,0,1,0,2,0) ||
      this.checkLine(0,1,1,1,2,1) ||
      this.checkLine(0,2,1,2,2,2) ||
    //check diagonally
      this.checkLine(0,0,1,1,2,2) ||
      this.checkLine(0,2,1,1,2,0);

    console.log(winner)

    if(winner !== false) {
        this.setState({
        gameover: true,
        winner: winner
      });
    }
  }

  createGame = () => {
    this.socket.emit('create game');
  }

  joinGame = (gameId) => {
    this.socket.emit('join game', gameId);
  }
}