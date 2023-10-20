import './App.css';

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import { init, useConnectWallet } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import { ethers } from 'ethers';
import { InputBox__factory, InputBox } from "@cartesi/rollups";


const INPUTBOX_ADDRESS = "0x59b22D57D4f067708AB0c00552767405926dc768";

// TODO: retrieve SHARD_ADDRESS using DAppSharding.calculateShardAddress
const SHARD_ADDRESS = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C";


// initialize web3-onboard
const injected = injectedModule();
init({
  wallets: [injected],
  chains: [
    {
      id: '0xAA36A7',
      token: 'ETH',
      label: 'Sepolia'
    }
  ]
});

export default function App() {

  // connect metamask wallet and contract instances
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  let ethersProvider: ethers.providers.Web3Provider;
  let inputBox: InputBox;
  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any');
    inputBox = InputBox__factory.connect(INPUTBOX_ADDRESS, ethersProvider.getSigner());
    if (!connecting) {
      ethersProvider.getSigner().getAddress().then(address =>
        console.log(`Connected with account "${address}"`)
     );
    }
  }

  const [game, setGame] = useState(new Chess());

  const [status, setStatus] = useState(<span>No check, checkmate, or draw.</span>)

  // updates board status on every re-render
  useEffect(() => {
    updateStatus();
  });  

  function startGame() {
    setGame(new Chess());
  }
  
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

  function onDrop(sourceSquare: string, targetSquare: string) {
    const originalBoard = game.fen();
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
  
      // send move to blockchain
      const payload = ethers.utils.toUtf8Bytes(move.san);
      console.log(`Sending move "${move.san}" as addInput with payload "${payload}"`);
      inputBox.addInput(SHARD_ADDRESS, payload).catch(e => {
        // revert board in case of error/reject when submitting
        console.error(e);
        setGame(new Chess(originalBoard));
      });

    } catch (e) {// illegal move or failure to send tx
      console.error(e);
      game.load(originalBoard);
      return false;
    }

    // update board
    setGame(new Chess(game.fen()));
      
    return true;
  }

  return (
    <div>
      <div className="center-left">
        <button className="start" onClick={startGame}>
          Start new game
        </button>
      </div>
      <div className="center">
        <div>
          <h1>Chess Dapp</h1>
        </div>
        <div>
          <button
            disabled={connecting}
            onClick={() => (wallet ? disconnect(wallet) : connect())}
          >
            {connecting ? 'connecting' : wallet ? 'disconnect' : 'connect'}
          </button>
        </div>
        <div id="MyBoard" className="ex1" style={wallet ? {} : {pointerEvents: "none", opacity: "0.4"}}>
          <Chessboard position={game.fen()} onPieceDrop={onDrop}/>
        </div>
        <div>
            <h2>Status</h2>
            <p>{status}</p>
        </div>
      </div>
    </div>
  );
}
