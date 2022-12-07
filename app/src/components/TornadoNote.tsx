import { useState } from "react";
import useCircuit from "../hooks/useCircuit";


function TornadoNote({ onResult }: { onResult: (note: string) => void }) {
  const { client } = useCircuit();

  const [note, setNote] = useState<string>("tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd");
  const [progress, setProgress] = useState<number>(0);
  const [proof, setProof] = useState<string>("");
  const [blacklist, setBlacklist] = useState<string>("");
  const [proofLoading, setProofLoading] = useState<boolean>(false);

  const fetchNote = async () => {
    if (!client){
      alert("wait one second ad try again");
      return;
    }
    const proofInputJson = await client.calculateProofFromNote(note, setProgress);
    setProof(proofInputJson);
    setProgress(100);
  }

  const generateProof = async () => {
    if (!client) return;
    setProofLoading(true);
    const proofWithBlacklist = await client.addBlacklist(proof, blacklist);
    onResult(proofWithBlacklist);
    setProofLoading(false);
  }

  return (
    <>
      <input
        className="border px-2 py-1 rounded-lg w-full"
        type="text"
        placeholder="Enter a note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      
      <button className="inline-block font-bold px-4 py-2 rounded bg-neutral-900 text-white" onClick={fetchNote}>Fetch</button>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{width:progress + "%"}}></div>
      </div>


      <p className="text-xl mb-4">Step 2. Enter your blacklisted commitments here</p>

        <textarea
        className="border px-2 py-1 rounded-lg w-full"
        placeholder="Enter a blacklist"
        onChange={(e) => setBlacklist(e.target.value)}
      ></textarea>
      <br />
      
      <button className="inline-block font-bold px-4 py-2 rounded bg-neutral-900 text-white" onClick={generateProof}>{proofLoading ? "Generating..." : "Generate Proof"}</button>
    </>
  );
}

export default TornadoNote;
