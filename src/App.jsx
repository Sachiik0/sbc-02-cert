import React, {useState} from 'react';
import './App.css';
import * as anchor from '@project-serum/anchor'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import idl from './jabol_test.json'
import { Buffer } from 'buffer';


globalThis.Buffer = Buffer;
const {SystemProgram, Keypair} = anchor.web3
let myAccount = Keypair.generate()
const programID = new PublicKey(idl.metadata.address)
console.log(programID,'programID set correctly')
const network = clusterApiUrl('devnet')
const opts = {preflightCommitment: 'processed'}



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
          console.log('connected with publicKey', res.publicKey.toString())
          setWalletAddress(res.publicKey.toString())
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
    setWalletAddress(res.publicKey.toString())
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

const Retrieve = async () =>{
  try{
    const provider = getProvider()
    const program = new anchor.Program(idl, programID, provider)

    const account = await program.account.init.fetch(myAccount.publicKey);
    setRetrieveValue(account.value.toString())
    console.log('retrieve value is ', retrieveValue)
  } catch (error){
  console.log('ERROR IN FETCHING: ', error)
  setRetrieveValue(null)
  }
}

const CreateAccount = async () => {
  try {
    const provider = getProvider();
    const program = new anchor.Program(idl, programID, provider);
    let tx = await program.rpc.initialize({
      accounts: {
        initialAccount: myAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [myAccount],
    })
      console.log('created new myAccount w/ address :', myAccount.publicKey.toString(),)
    }
   catch (error) {
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
    const value = new anchor.BN(inputValue)

    let tx2 = await program.rpc.updateValue(value,{
      accounts: {
        storageAccount: myAccount.publicKey,
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
