import { useState } from "react";

import TornadoNote from "../components/TornadoNote";
import axios from "axios";

function Prove() {
  const [proof, setProof] = useState<string>('');
  const [cid, setCid] = useState<string>("");

  const saveToIpfs = async () => {
    console.log("saving to ipfs")
    // send request to https://proof-of-innocence.herokuapp.com/api with proof as post body
    // set cid to response
    console.log(proof);
    const response = await axios.post("https://proof-of-innocence.herokuapp.com/api", JSON.parse(proof));
    console.log(response.data);
    setCid(response.data['ipfsHash']);
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <p className="text-xl mb-4">Step 1. Get past Tornado Cash deposits</p>
      <TornadoNote onResult={setProof}/>
      <p>{proof}</p>
      <p className="text-xl mb-4">Step 3. Save your proof to IPFS</p>
      <button className="inline-block font-bold px-4 py-2 rounded bg-neutral-900 text-white" onClick={saveToIpfs}>Save to IPFS</button>
      {cid && <><p  className="text-xl mb-4">Proof saved</p><a className="underline text-xl mb-4 color-blue-200" href={`/verify/${cid}`}>Go to your Proof of Innocence</a></>}
    </div>
  );
}

export default Prove;
