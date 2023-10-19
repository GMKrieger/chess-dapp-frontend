import './App.css';

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function App() {
  const [game, setGame] = useState(new Chess());

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
    let gameCopy = new Chess(game.fen())
    setGame(gameCopy);

    return true;
  }

  return (    
  <body>
    <main>
        <div class="container my-2">
            <div class="row align-items-center">
                <div class="center">
                    <h1>Chess Dapp</h1>
                    <div>
                        <div id="MyBoard" class="ex1">
                          <Chessboard position={game.fen()} onPieceDrop={onDrop} onMouseOverSquare={onMouseoverSquare}/>
                        </div>
                        <div class="col-md-12">
                            <h2 class="center">Status</h2>
                            <p><span id="status">No check, checkmate, or draw.</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>);
}
