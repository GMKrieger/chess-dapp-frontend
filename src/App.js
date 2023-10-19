import './App.css';

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function App() {
  const [game, setGame] = useState(new Chess());

  const [status, setStatus] = useState(<span>No check, checkmate, or draw.</span>)

  function sayHello() {
    alert('You clicked me!');
  }
  // Usage
  <button onClick={sayHello}>Default</button>;

  function updateStatus() {
    const color = game.turn() === 'w' ? 'White' : 'Black'

    if (game.isCheckmate()) {
      setStatus(<span><b>Checkmate!</b> <b>{color}</b> lost.</span>);
    } else if (game.isInsufficientMaterial()) {
      setStatus(<span>It's a <b>draw!</b> (Insufficient Material)</span>);
    } else if (game.isThreefoldRepetition()) {
      setStatus(<span>It's a <b>draw!</b> (Threefold Repetition)</span>);
    } else if (game.isStalemate()) {
      setStatus(<span>It's a <b>draw!</b> (Stalemate)</span>);
    } else if (game.isDraw()) {
      setStatus(<span>It's a <b>draw!</b> (50-move Rule)</span>);
    } else if (game.isCheck()) {
      setStatus(<span><b>{color}</b> is in <b>check!</b></span>);
      return false;
    } else {
      setStatus(<span>No check, checkmate, or draw.</span>);
      return false;
    }
    return true;
  }

  function onDrop(sourceSquare, targetSquare) {
    try{
      game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
    }catch{// illegal move
      return false;
    }
    updateStatus();

    let gameCopy = new Chess(game.fen())
    setGame(gameCopy);

    return true;
  }

  return (
  <body>
    <main>
        <div>
            <div>
                <div class="center-left">
                  <button class="start" onClick={sayHello}>
                    Start new game
                  </button>
                </div>
                <div class="center">
                  <div>
                    <h1>Chess Dapp</h1>
                  </div>
                  <div id="MyBoard" class="ex1">
                    <Chessboard position={game.fen()} onPieceDrop={onDrop}/>
                  </div>
                  <div>
                      <h2>Status</h2>
                      <p>{status}</p>
                  </div>
                </div>
            </div>
        </div>
    </main>
</body>);
}
