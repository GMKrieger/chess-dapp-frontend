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

const MAINDAPP_ADDRESS = "0x20840b831add95B40bb91B800292293FA8F58906";
const TEMPLATE_HASH = "0x80de56710c465209aeb36b4766a06e70eaa27041b2dba90a4fdd1619fe2f11d9";
let timestamp: any = (new Date()).valueOf();
const GAME_ID = keccak256(timestamp);

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

let shardAddress: string;

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

  // updates board status on every re-render
  useEffect(() => {
    updateStatus();
  }, [game]);

  function verifyGame(){
    setStatus(<span>Verifying game results.</span>);
    dappSharding.createShard(MAINDAPP_ADDRESS, TEMPLATE_HASH, GAME_ID).catch(e => {
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
    await inputBox.addInput(MAINDAPP_ADDRESS, payload).catch(e => {
      console.error(e);
    });
    //await notice GameReady

    shardAddress = await dappSharding.calculateShardAddress(MAINDAPP_ADDRESS, TEMPLATE_HASH, GAME_ID);
    console.log(`Starting game on shard "${shardAddress}"`);
    setGame(new Chess());
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
  
  function updateStatus() {
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
    <div>
      <div>
        <div className='center-left'>
          <button className="start" onClick={startGame}>
            Start new game
          </button><br></br>
          <button className="start" onClick={verifyGame}>
            Verify game results
          </button>
        </div>
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
      <div></div>
    </div>
  );
}
