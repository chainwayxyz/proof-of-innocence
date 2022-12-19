import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import useCircuit from "../hooks/useCircuit";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import ProofDetails from "../components/ProofDetails";

function Verify() {  
  const { client } = useCircuit();

  const { id } = useParams();
  const [proof, setProof] = useState<{a:string[],b:string[][],c:string[]}>();
  const [publicInputs, setPublicInputs] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const [RpcUrl, setRpcUrl] = useState<string>("https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
  const [result, setResult] = useState<boolean>();
  const [error, setError] = useState<string>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);


  

  const shareOnTwitterButton = () => {
    const url = `https://twitter.com/intent/tweet?text=I%20just%20proved%20that%20I%20am%20innocent%20of%20withdrawing%20a%20note%20with%20the%20following%20proof%20on%20Proof%20of%20Innocence%20https://proofofinnocence.netlify.app/verify/${id}`;
    window.open(url, "_blank");
  }

  const verifyProof = async () => {
    if (!client){
      setError("client not found");
      return;
    }
    setIsLoading(true);
    setLoadingMsg("Verifying proof...");
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
    setLoadingMsg("Verifying Blacklist Merkle root...");
    const root = await client.getMerkleRoot(blacklist);
    console.log(root);
    console.log(publicInputs);
    if(publicInputs[2] != root){
      setError("Root does not match");
      return;
    }
    setIsLoading(false);
    setResult(true);
    setIsModalOpen(true);
  }

  useEffect(() => {
    const getFromIpfs = async () => {
      setIsLoading(true);
      setLoadingMsg("Fetching proof from IPFS...");
      const url = `https://gateway.pinata.cloud/ipfs/${id}`;
      const response = await fetch(url);
      const proof = await response.json();
      const proofData: {a:string[],b:string[][],c:string[]} = proof?.proof || {a:[],b:[],c:[]};
      const publicInputs: string[] = proof?.publicInputs || [];
      const blacklist: string[] = proof?.blacklist || [];
      setProof(proofData);
      setPublicInputs(publicInputs);
      setBlacklist(blacklist);
      setIsLoading(false);
    }  
    getFromIpfs();
  }, [id]);

  useEffect(() => {
    if (client) setIsLoading(false);
    else setLoadingMsg("Client is loading...");
  }, [client])

  return (
    <>
    {isLoading && (<Loading progress={0} loadingMsg={loadingMsg} />)}
    <div className="flex flex-col gap-y-4">
      <ProofDetails id={id as string} proof={proof as {a: string[];b: string[][];c: string[]}} publicInputs={publicInputs} blacklist={blacklist} />
      <button className="inline-block font-bold px-4 py-2 border rounded" onClick={verifyProof}>Verify Proof</button>
      {result && isModalOpen && <Modal setIsModalOpen={setIsModalOpen} modalContent={"Proof is valid."} modalButtonsFunctions={[[shareOnTwitterButton, "Share on Twitter"]]}/>}
    </div>
    </>
  );
}

export default Verify;
