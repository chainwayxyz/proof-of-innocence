import { useEthers, useLocalStorage } from "@usedapp/core";
import { Proof } from "circuits";
import { EdDSASignature } from "circuits/src/eddsa";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";
import Connect from "./components/Connect";
import GenZKP from "./components/GenZKP";
import SendTx from "./components/SendTx";
import SignEdDSA from "./components/SignEdDSA";
import Viewer from "./components/Viewer";
import useEdDSA from "./hooks/useEdDSA";
import Deploy from "./components/Deploy";

import TornadoNote from "./components/TornadoNote";
import GenProof from "./components/GenProof";

// import ipfs-http-client
import ipfsClient from 'ipfs-http-client'

// const address = process.env["REACT_APP_CONTRACT_ADDRESS"] as string;
// if (typeof address !== "string") throw Error("Configure contract address");
// const msgToSign = BigNumber.from("0x1234").toBigInt();

function App() {
  // const { account } = useEthers();
  // const privKey = account || undefined;
  // const { pubKey } = useEdDSA(privKey);
  // const [eddsaSignature, setEdDSASignature] = useState<EdDSASignature>();
  const [proof, setProof] = useState<string>("asd");
  const [cid, setCid] = useState<string>("");

  const saveToIpfs = async () => {
    console.log("saving to ipfs")
    // console.log(ipfsClient)
    const ipfs = ipfsClient('api.pinata.cloud', '5001', {protocol: 'https'})
    console.log("yey generating cid")
    // console.log(x)
    // // saves proof to ipfs with ipfsClient
    // const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
    // const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
    const { cid } = await ipfs.add(Buffer.from(proof))
    console.log("Noluyo")
    console.log(cid.toString())
    setCid(cid.toString())
    // // const ipfs = ipfsClient.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
    // const { cid } = await ipfs.add(proof)
    // console.log(cid.toString())
    // setCid(cid.toString())
    // const ipfs = await import('ipfs-http-client')
    // const client = ipfs.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
    // const { cid } = await client.add(proof)
    // console.log(cid.toString())
    // setCid(cid.toString())
  }
  
  return (
    <div className="App">
      <h1>Proof of Innocence</h1>
      {/* <h2>Step 1. Connect your wallet</h2>
      <Connect /> */}
      <h2>Step 2. Get past Tornado Cash deposits</h2>
      <p>You can use my goerli deposit note here:<br/> tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd</p>
      <TornadoNote onResult={setProof}/>
      {proof}
      <h2>Step 4. Send your proof to ipfs</h2>
      <button onClick={saveToIpfs}>Save to IPFS</button>
      {/* <h2>Step 2. Deploy smart contracts</h2>
      <Deploy onResult={setDeployed} />
      <h2>Step 3. Check the data fetch from the smart contract</h2>
      {deployed ? <Viewer address={deployed} /> : <p>Not deployed</p>}
      <h2>Step 4. Prepare zkp signals</h2>
      <SignEdDSA
        privKey={privKey}
        message={msgToSign}
        onResult={(result) => setEdDSASignature(result)}
      />
      <h2>Step 5. Compute a zk proof</h2>
      <GenZKP
        message={msgToSign}
        pubKey={pubKey}
        signature={eddsaSignature}
        onResult={(result) => setProof(result)}
      />
      <h2>Step 6. Interact with smart contract using the generated proof</h2>
      {deployed ? (
        <SendTx
          address={deployed}
          publicSignals={pubKey ? [msgToSign, ...pubKey] : undefined}
          proof={proof}
        />
      ) : (
        <p>Not deployed</p>
      )} */}
    </div>
  );
}

export default App;
