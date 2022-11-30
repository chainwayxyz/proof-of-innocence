import { useEffect, useState } from "react";

import useCircuit from "../hooks/useCircuit";
import { Deposit } from "circuits";



function GenProof( { merkleProof,  onResult }: { merkleProof: string, onResult: (note: string) => void }) {
  const { client } = useCircuit();

  const [blacklist, setBlacklist] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const generateProof = async () => {
    if (!client) return;
    alert(merkleProof);
    // const proofInputJson = await client.calculateProofFromNote(note, setProgress);
    // onResult(proofInputJson);
    // console.log(await client.calculateProofFromNote(note, setProgress));
  }

  return (
    <div>
      <textarea
        placeholder="Enter a blacklist"
        onChange={(e) => setBlacklist(e.target.value)}
      ></textarea>
      <br />
      
      <button onClick={generateProof}>Generate Proof</button>
      <br/>
    </div>
  );
}

export default GenProof;
