import { useEffect, useState } from "react";
import useCircuit from "../hooks/useCircuit";
import axios from "axios";

function TornadoNote() {
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
      setLoadingMsg("Saving proof to IPFS...");
      const cid = await saveToIpfs(proofWithBlacklist);
      setCid(cid);
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
    {isLoading && (
<div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center m-0">
	<div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
	<h2 className="text-center text-white text-xl font-semibold">Loading... {progress != 0 && Math.floor(progress) + "%"}</h2>
	<p className="w-1/3 text-center text-white">{loadingMsg}</p>
</div>
)}
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

  {/* <div id="popup-modal" tabIndex={-1} className="fixed top-0 left-0 right-0 z-50 hidden p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
    <div className="relative w-full h-full max-w-md md:h-auto">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-toggle="popup-modal">
                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                <span className="sr-only">Close modal</span>
            </button>
            <div className="p-6 text-center">
                <svg aria-hidden="true" className="mx-auto mb-4 text-gray-400 w-14 h-14 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this product?</h3>
                <button data-modal-toggle="popup-modal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Download proof</button>
                <button data-modal-toggle="popup-modal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Save to IPFS</button>
            </div>
        </div>
    </div>
</div> */}


      <button className="inline-block font-bold px-4 py-2 border rounded" onClick={generateProof}>Generate Proof</button>
      {cid && <a className="underline text-xl mb-4 text-green-500" href={`/verify/${cid}`}>Go to your Proof of Innocence</a>}
    </div>
    </>
  );
}

export default TornadoNote;
