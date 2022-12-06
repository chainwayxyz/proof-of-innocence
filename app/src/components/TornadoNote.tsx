import { useEffect, useState } from "react";

import useCircuit from "../hooks/useCircuit";
import { Deposit } from "circuits";



function TornadoNote({ onResult }: { onResult: (note: string) => void }) {
  const { client } = useCircuit();

  const [note, setNote] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [proof, setProof] = useState<string>("");
  const [blacklist, setBlacklist] = useState<string>("");

  const fetchNote = async () => {
    if (!client) return;
    const proofInputJson = await client.calculateProofFromNote(note, setProgress);
    setProof(proofInputJson);
  }

  const generateProof = async () => {
    if (!client) return;
    const proofWithBlacklist = await client.addBlacklist(proof, blacklist);
    onResult(proofWithBlacklist);
    // setSon(proofWithBlacklist);
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Enter a note"
        onChange={(e) => setNote(e.target.value)}
      />
      <br />
      
      <button onClick={fetchNote}>Fetch</button>
      <br/>
      <progress id="fetched" value={progress} max="100"></progress>
      <br />
      <h2>Step 3. Enter your blacklisted commitments here</h2>
      {<>
        <textarea
        placeholder="Enter a blacklist"
        onChange={(e) => setBlacklist(e.target.value)}
      ></textarea>
      <br />
      
      <button onClick={generateProof}>Generate Proof</button>
      <p>This may take a while</p>

      </>}
    </div>
  );
}

export default TornadoNote;
