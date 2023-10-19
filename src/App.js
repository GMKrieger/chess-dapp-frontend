import './App.css';

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function PlayRandomMoveEngine() {
  const [game, setGame] = useState(new Chess());

  function onDrop(sourceSquare, targetSquare) {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    });

    setGame(game);

    // illegal move
    if (move === null) return false;
    return true;
  }

  return (    
  <body>
    <main>
        <div class="container my-2">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="text-align-center">Chess Dapp</h1>
                    <div class="row my-3 text-align-center">
                        <div class="col-md-12">
                          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
                        </div>
                        <div class="col-md-12">
                            <h2>Status</h2>
                            <p><span id="status">No check, checkmate, or draw.</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>);
}
