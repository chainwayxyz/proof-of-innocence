import { useEffect, useState } from "react";
import useCircuit from "../hooks/useCircuit";
import axios from "axios";
import Modal from "../components/Modal";
import Loading from "../components/Loading";

function Prove() {
  const { client } = useCircuit();

  const [note, setNote] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [proofInput, setProofInput] = useState<string>("");
  const [proof, setProof] = useState<string>("");
  const [blacklist, setBlacklist] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [noteError, setNoteError] = useState<string>("");
  const [blacklistError, setBlacklistError] = useState<string>("");
  const [cid, setCid] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchNote = async () => {
    if (!client){
      setNoteError("Client not found");
      return;
    }
    try{
      setNoteError("");
      setIsLoading(true);
      setLoadingMsg("Fetching past deposit events...");
      const proofInputJson = await client.calculateProofFromNote(note, setProgress);
      setProofInput(proofInputJson);
      setProgress(100);
      setIsLoading(false);
      setProgress(0);
    } catch (e : any) {
      console.log(e);
      setNoteError(e.message as string);
      setIsLoading(false);
    }
  }

  const saveToIpfs = async (proof: string) => {
    const response = await axios.post("https://proof-of-innocence.herokuapp.com/api", JSON.parse(proof));
    return response.data['ipfsHash'];
  }

  const saveToIpfsButton = async () => {
    if (!proof){
      setBlacklistError("Proof not found");
      return;
    }
    setIsLoading(true);
    setLoadingMsg("Saving proof to IPFS...");
    const cid = await saveToIpfs(proof);
    setCid(cid);
    setIsLoading(false);
    // open new tab with url /verify/{cid}

    window.open(`/verify/${cid}`, "_blank");
  }

  const downloadProofButton = async () => {
    if (!proof){
      setBlacklistError("Proof not found");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([proof], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "proof.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }



  const generateProof = async () => {
    if (!client){
      setBlacklistError("Client not found");
      return;
    }
    try{
      setBlacklistError("");
      setIsLoading(true);
      setLoadingMsg("Generating ZK proof...");
      const proofWithBlacklist = await client.addBlacklist(proofInput, blacklist);
      setProof(proofWithBlacklist);
      setIsModalOpen(true);
      setIsLoading(false);
    } catch (e : any) {
      console.log(e);
      setBlacklistError(e.message as string);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (client) setIsLoading(false);
    else setLoadingMsg("Client is loading...");
  }, [client])

  useEffect(() => {
    if (client)
      fetchNote();
  }, [note])

  return (
    <>
    {isLoading && (<Loading progress={progress} loadingMsg={loadingMsg} />)}
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <label htmlFor="note-field" className="font-bold">Note:</label>
          <button className="underline float-right" onClick={() => setNote("tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd")}>
            Use demo note
          </button>
        </div>
        <input
          id="note-field"
          className={`border px-2 py-1 rounded-lg w-full focus:outline-none  ${noteError ? "border-red-700" : ""}`}
          type="text"
          placeholder="Please enter your note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {noteError && <p className="text-red-700 font-bold">{noteError}</p>}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <label htmlFor="blacklist-field" className="font-bold">Blacklist:</label>
          <button className="underline float-right" onClick={() => setBlacklist("123\n124")}>
            Use chainanalysis blacklist
          </button>
        </div>
        <textarea
        id="blacklist-field"
        className={`border px-2 py-1 rounded-lg w-full focus:outline-none  ${blacklistError ? "border-red-700" : ""}`}
        placeholder="Enter blacklist commitments, one per line"
        value={blacklist}
        onChange={(e) => setBlacklist(e.target.value)}
      ></textarea>
        {blacklistError && <p className="text-red-700 font-bold">{blacklistError}</p>}
      </div>

      { (isModalOpen && !isLoading ) && (
        <Modal setIsModalOpen={setIsModalOpen} modalContent={"Your proof is ready."} modalButtonsFunctions={[[downloadProofButton, "Download proof"], [saveToIpfsButton, "Save to IPFS"]]}/>
      )}


      <button className="inline-block font-bold px-4 py-2 border rounded" onClick={generateProof}>Generate Proof</button>
    </div>
    </>
  );
}

export default Prove;
