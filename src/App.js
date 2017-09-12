import React from 'react';
import io from 'socket.io-client';
import './App.css'

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.socket = io('http://localhost:5555');
    this.socket.on('games', games => this.setState({games}));
    this.socket.on('game', game => this.setState({game}));
    this.socket.on('joined a game', (data) => this.setState({game: data.game, mark: data.mark}));
  }

  state = {
    games: null,
    game: null,
    mark: null
  }

  render() {
    let {games, game, mark} = this.state;
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
                  <td key={x} onClick={col === '' && !game.winner ? () => this.placeMark(game.id, y, x) : null}>
                    {col !== '' ? col : <span>{mark}</span>}
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

  placeMark = (gameId, y, x) => {
    if(this.state.mark !== this.state.game.turn) return;
    console.log('placed mark')
    this.socket.emit('place mark', {gameId, y, x, socketId: this.socket.id});
  }

  resetGame = () => {
    
  }

  createGame = () => {
    this.socket.emit('create game', this.socket.id);
  }

  joinGame = (gameId) => {
    this.socket.emit('join game', {gameId, socketId: this.socket.id});
  }
}