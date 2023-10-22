import './App.css';

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import { init, useConnectWallet } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import { ethers } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { InputBox__factory, InputBox } from "@cartesi/rollups";
import { DAppSharding__factory, DAppSharding} from "dapp-sharding";
import InputBoxDeployment from "@cartesi/rollups/deployments/sepolia/InputBox.json"
import DAppShardingDeployment from "dapp-sharding/deployments/sepolia/DAppSharding.json";

const MAINDAPP_ADDRESS = "0xC0bF2492b753C10eB3C7f584f8F5C667e1e5a3f5";
const TEMPLATE_HASH = "0xc1d186ac3c6100351f8a1bfe354bf44968daa8e4bc70c60e71ea3a803d8178ca";

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
  let dappSharding: DAppSharding;
  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any');
    inputBox = InputBox__factory.connect(InputBoxDeployment.address, ethersProvider.getSigner());
    dappSharding = DAppSharding__factory.connect(DAppShardingDeployment.address, ethersProvider.getSigner());
    if (!connecting) {
      ethersProvider.getSigner().getAddress().then(address =>
        console.log(`Connected with account "${address}"`)
     );
    }
  }

  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState(<span>No check, checkmate, or draw.</span>)
  const [gameId, setGameId] = useState("");
  const [shardAddress, setShardAddress] = useState<string>();

  // updates board status on every re-render
  useEffect(() => {
    updateStatus(game);
  }, [game]);

  function verifyGame(){
    setStatus(<span>Verifying game results.</span>);
    dappSharding.createShard(MAINDAPP_ADDRESS, TEMPLATE_HASH, gameId).catch(e => {
      // revert board in case of error/reject when submitting
      console.error(e);
      setStatus(<span>Error during verification</span>);
    });;
    // Await voucher GameResult
  }

  async function startGame() {
    // Send join game request to blockchain
    const payload = ethers.utils.toUtf8Bytes("joinGame");
    console.log(`Sending joinGame as addInput with payload "${payload}"`);
    try {
      await inputBox.addInput(MAINDAPP_ADDRESS, payload);
      //await notice GameReady
    } catch (e) {
      console.error(e);
      return;
    }

    // define gameId and calculate shard address
    const timestamp: any = (new Date()).valueOf();
    const newGameId = keccak256(timestamp);
    const newShardAddress = await dappSharding.calculateShardAddress(MAINDAPP_ADDRESS, TEMPLATE_HASH, newGameId);
    console.log(`Starting game on shard "${newShardAddress}"`);
    setGame(new Chess());
    setGameId(newGameId);
    setShardAddress(newShardAddress);
  }

  function sendResult(result: string){
    // Send game result to blockchain
    // Call claimResult
    const payload = ethers.utils.toUtf8Bytes(result);
    console.log(`Sending gameResult as addInput with payload "${payload}"`);
    inputBox.addInput(MAINDAPP_ADDRESS, payload).catch(e => {
      console.error(e);
    });
  }
  
  function updateStatus(game: any) {
    const color = game.turn() === 'w' ? 'White' : 'Black'

    if (game.isCheckmate()) {
      setStatus(<span><b>Checkmate!</b> <b>{color}</b> lost.</span>);
      //sendResult(game.turn() === 'w' ? 'b' : 'w');
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
    if (!shardAddress) {
      console.error("No game shard defined");
      return false;
    }
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
      inputBox.addInput(shardAddress, payload).catch(e => {
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
    <div className='center'>
      <div>
        <h1>Chess DApp</h1>
      </div>
      <div>
        <div className='center-left'>
          <div>
            <button className="start"
              disabled={connecting}
              onClick={() => (wallet ? disconnect(wallet) : connect())}
            >
              {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          <div>
            <button className="start" onClick={startGame} style={wallet ? {} : {pointerEvents: "none", opacity: "0.4"}}>
              Start new game
            </button>
          </div>
          <div>
            <button className="start" onClick={verifyGame} style={wallet && shardAddress ? {} : {pointerEvents: "none", opacity: "0.4"}}>
              Verify game results
            </button>
          </div>
        </div>
        <div id="MyBoard" className="ex1" style={wallet && shardAddress ? {} : {pointerEvents: "none", opacity: "0.4"}}>
          <Chessboard position={game.fen()} onPieceDrop={onDrop}/>
        </div>
      </div>
      <div>
          <h2>Status</h2>
          <p>{status}</p>
          { shardAddress && <p><b>Shard: </b>{shardAddress}</p> }
      </div>
    </div>
  );
}
