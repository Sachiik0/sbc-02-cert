import React, {useState} from 'react';
import './App.css';
import * as anchor from '@project-serum/anchor'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import idl from './jabol_test.json'
import { Buffer } from 'buffer';
import * as utf8 from 'utf8';



const {SystemProgram, Keypair} = anchor.web3
let myAccount = Keypair.generate()
const programID = new PublicKey(idl.metadata.address)
console.log(programID,'programID set correctly')
const network = clusterApiUrl('devnet')
const opts = {preflightCommitment: 'processed'}
globalThis.Buffer = Buffer; 


function App() {

  const [walletAddress, setWalletAddress] = useState(null)
  const [retrieveValue, setRetrieveValue] = useState(null)
  const [inputValue, setInputValue] = useState(' ')
  window.onload = async function () {
    try{
      if(window.solana){
        const solana = window.solana
        if(solana.isPhantom){
          console.log('phantom wallet found')
          const res = await solana.connect({onlyIfTrusted: true})
          console.log('connected with publicKey', res.publicKey.toBase58())
          setWalletAddress(res.publicKey.toBase58())
          await Retrieve()
          if (retrieveValue == null){
            await CreateAccount()
          }
        } 
      } else {
        alert('wallet not found')
      }
    }catch(error){
        console.log(error)
    }
}

const connectWallet = async () => {
  if (window.solana){
    const solana = window.solana
    const res = await solana.connect()
    setWalletAddress(res.publicKey.toBase58())
  } else {
    alert('wallet not found')
  }
}
const getProvider = () =>{
  const connection = new Connection(network, opts.preflightCommitment)
  const provider = new anchor.AnchorProvider(
    connection,
    window.solana,
    opts.preflightCommitment,
  )
  console.log(provider, 'provider set correctly')
  return provider
} 

const Retrieve = async () => {
  try {
    const provider = getProvider();
    const program = new anchor.Program(idl, programID, provider);

    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('initial-account'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const account = await program.account.init.fetch(pda);
    setRetrieveValue(account.value.toString());
    console.log('retrieve value is ', retrieveValue);
  } catch (error) {
    console.log('ERROR IN FETCHING: ', error);
    setRetrieveValue(null);
  }
}



const CreateAccount = async () => {
  try {
    const provider = getProvider();
    const program = new anchor.Program(idl, programID, provider);

    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('initial-account'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    console.log('pda', pda.toString());
    const pdaAccount = await provider.connection.getAccountInfo(pda);

    if (pdaAccount === null) {
      let tx = await program.rpc.initialize({
        accounts: {
          initialAccount: pda, // Using PDA as the account
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signer: [myAccount], // Correctly passing the keypair
      });
      console.log('Created new myAccount w/ address:', myAccount.publicKey.toBase58());
    } else {
      const account = await program.account.init.fetch(pda);
      console.log('Retrieved existing account data:', account);
    }
  } catch (error) {
    console.log('ERROR IN CREATING/INITIALIZING ACCOUNT', error);
    setRetrieveValue(null);
  }
};



const onInputChange = (event) =>{
  const {value}= event.target
  setInputValue(value)
}
const UpdateValue = async () =>{
  try{
    const provider = getProvider()
    const program = new anchor.Program(idl, programID, provider)
    const value = inputValue
    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('initial-account'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    let tx2 = await program.rpc.updateValue(value,{
      accounts: {
        user: provider.wallet.publicKey,
        initialAccount: pda,
      },
    })
  }catch (error){
    console.log('ERROR IN UPDATING THE VALUE', error)

  }
  
}


  return (
    <div className="App">
      <header className="App-header">
        {!walletAddress && (
        <div>
          <button className='btn' onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
        )}
        {walletAddress && (
        <div>
          <p>
            Connected Account :{' '}
            <span className='address'>{walletAddress}</span>
          </p>
          <div className="grid-item">
            {/*set value column one */}
            <input
            placeholder="value"
            value = {inputValue}
            onChange={onInputChange}
            ></input>
            <br></br>
            <button className="btn2" onClick={UpdateValue}>Store</button>
          </div>
          {/*get value column two */}
          <div className="grid-item">
            <button className="btn2" onClick={Retrieve}>
              Retrieve
            </button>
            <p>{retrieveValue}</p>
            
          </div>
        </div>
      )}
      </header>
    </div>
  );
}

export default App;
