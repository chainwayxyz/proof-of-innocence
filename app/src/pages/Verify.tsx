import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import useCircuit from "../hooks/useCircuit";

// create a type for the proof object
type Proof = {
  proof: {
    a: string[];
    b: string[][];
    c: string[];
  };
  publicInputs: string[];
  blacklist: string[];
};


function Verify() {  
  const { client } = useCircuit();

  const { id } = useParams();
  const [proof, setProof] = useState<{a:string[],b:string[][],c:string[]}>();
  const [publicInputs, setPublicInputs] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const [RpcUrl, setRpcUrl] = useState<string>("https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
  const [result, setResult] = useState<boolean>();
  const [error, setError] = useState<string>();

  const [blacklistExpanded, setBlacklistExpanded] = useState<boolean>(false);


  const verifyProof = async () => {
    if (!client){
      setError("client not found");
      return;
    }
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const contract = new ethers.Contract(
      "0x665796b55073B077f200B79eB4790196aA7bCd6a",
      [{"inputs":[{"internalType":"uint256[3]","name":"publicSignals","type":"uint256[3]"},{"components":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"}],"internalType":"struct ProofOfInnocence.Proof","name":"proof","type":"tuple"}],"name":"verify","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],
      provider
    );
    const result = await contract.verify(publicInputs, proof);
    console.log(result);
    if(!result){
      setError("Proof is invalid");
      return;
    }
    const root = await client.getMerkleRoot(blacklist);
    console.log(root);
    console.log(publicInputs);
    if(publicInputs[2] != root){
      setError("Root does not match");
      return;
    }
    setResult(true);
  }

  const shorten = (id: string | undefined) => {
    if (!id) return "Loading";
    return id.slice(0, 6) + "..." + id.slice(-4);
  }

  const toHex = (id: string | undefined) => {
    if (!id) return "Loading";
    // convert decimal string of id to hex
    return "0x" + BigInt(id).toString(16);
  }

  useEffect(() => {
    const getFromIpfs = async () => {
      const url = `https://gateway.pinata.cloud/ipfs/${id}`;
      const response = await fetch(url);
      const proof = await response.json();
      const proofData: {a:string[],b:string[][],c:string[]} = proof?.proof || {a:[],b:[],c:[]};
      const publicInputs: string[] = proof?.publicInputs || [];
      const blacklist: string[] = proof?.blacklist || [];
      setProof(proofData);
      setPublicInputs(publicInputs);
      setBlacklist(blacklist);
    }  
    getFromIpfs();
  }, [id]);

  return (
    <div className="App">
      <h1 className="text-3xl font-bold">Proof details</h1>
      <div><p className="text-xl underline inline-block">IPFS Hash: </p><p className="text-xl inline-block">{shorten(id)}</p></div>
      <div><p className="text-xl underline inline-block">Nullifier Hash: </p><p className="text-xl inline-block">{shorten(toHex(publicInputs[0]))}</p></div>
      <div><p className="text-xl underline inline-block">Merkle Root: </p><p className="text-xl inline-block">{shorten(toHex(publicInputs[1]))}</p></div>
      <div><p className="text-xl underline inline-block">Blacklist Root: </p><p className="text-xl inline-block">{shorten(toHex(publicInputs[2]))}</p></div>
      <div><p className="text-xl underline inline-block">Blacklisted Commitments: </p><p className="text-xl inline-block">{blacklist.length} <button onClick={() => {setBlacklistExpanded(!blacklistExpanded)}}>{blacklistExpanded ? "Click to close":"Click to open"}</button></p></div>
      {blacklistExpanded && <div className="text-xl">
        {blacklist.map((commitment, index) => {
          return <p key={index}>{shorten(toHex(commitment))}</p>
        })}
      </div>}
      <br/>
      <button className="inline-block font-bold px-4 py-2 rounded bg-neutral-900 text-white" onClick={verifyProof}>Verify Proof</button>
      <br/>
      {result && <p className="text-5xl underline text-green my-6">Proof is valid</p>}
    </div>
  );
}

export default Verify;
