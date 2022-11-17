import { useEffect, useState } from "react";
import { BigNumber } from "ethers";

import useCircuit from "../hooks/useCircuit";
import { Deposit } from "circuits";



function TornadoNote({ onResult }: { onResult: (note: string) => void }) {
  const { client } = useCircuit();

  const [note, setNote] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);



  const fetchNote = async () => {
    if (!client) return;
    console.log(client.parseNote(note))
  }

  useEffect(() => {
    if (note) onResult(note);
  }, [note]);

  return (
    <div>
      <input
        type="text"
        placeholder="Enter a note"
        onChange={(e) => setNote(e.target.value)}
      />
      <br />
      <button onClick={fetchNote}>Fetch</button>
    </div>
  );
}

export default TornadoNote;
