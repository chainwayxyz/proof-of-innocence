import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
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
  const { id } = useParams();
  const [proof, setProof] = useState<Proof>();
  const [RpcUrl, setRpcUrl] = useState<string>("https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
  const [result, setResult] = useState<boolean>();


  const verifyProof = async () => {
    alert(RpcUrl);
    const provider = new ethers.providers.JsonRpcProvider(RpcUrl);
    const contract = new ethers.Contract(
      "0x665796b55073B077f200B79eB4790196aA7bCd6a",
      [{"inputs":[{"internalType":"uint256[3]","name":"publicSignals","type":"uint256[3]"},{"components":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"}],"internalType":"struct ProofOfInnocence.Proof","name":"proof","type":"tuple"}],"name":"verify","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],
      provider
    );
    const result = await contract.verify(proof?.publicInputs, proof?.proof);
    console.log(result);
    setResult(result);
    

    console.log("verifying proof")
  }

  useEffect(() => {
    const getFromIpfs = async () => {
      // make get requset to https://gateway.pinata.cloud/ipfs/{id}
      // set proof to response
      const url = `https://gateway.pinata.cloud/ipfs/${id}`;
      console.log(url)
      const response = await fetch(url);
      
      const data = await response.json();
      console.log(data);
      setProof(data);
    }  
    getFromIpfs();
  }, [id]);

  return (
    <div className="App">
      <h1 className="text-3xl font-bold underline" style={{color:"red"}}>Verify your proof</h1>
      <input
        type="text"
        value={RpcUrl}
        onChange={(e) => setRpcUrl(e.target.value)}
      />
      <br/>

      <button onClick={verifyProof}>Verify</button>
      <br/>
      {id}
      <br/>
      {proof?.proof.a}
      <br/>
      {result && "Proof is valid"}
    </div>
  );
}

export default Verify;
