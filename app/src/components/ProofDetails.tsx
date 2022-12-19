import { useState } from "react";

const shorten = (id: string | undefined) => {
  if (!id) return "Loading";
  return id.slice(0, 6) + "..." + id.slice(-4);
}

const toHex = (id: string | undefined) => {
  if (!id) return undefined;
  return "0x" + BigInt(id).toString(16);
}

export default function ProofDetails({id, proof, publicInputs, blacklist}:
  {
    id:string,
    proof:{a:string[],b:string[][],c:string[]},
    publicInputs:string[],
    blacklist:string[]
  }) {
    const [blacklistExpanded, setBlacklistExpanded] = useState<boolean>(false);
    return (
    <>
      <h1 className="text-3xl font-bold">Proof details</h1>
      {/* Make a grid with 5 rows 2 columns where the first column's witdh is minimum */}

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

    </>
  );
  }