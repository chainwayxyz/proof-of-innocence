import { useState } from "react";

const shorten = (id: string | undefined) => {
  if (!id) return "Loading";
  return id.slice(0, 6) + "..." + id.slice(-6);
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
      <table className="border">
      <tbody>
        <tr>
          <td className="text-xl underline text-left">IPFS Hash: </td>
          <td className="text-xl">{shorten(id)}</td>
        </tr>
        <tr>
          <td className="text-xl underline text-left">Nullifier Hash: </td>
          <td className="text-xl">{shorten(toHex(publicInputs[0]))}</td>
        </tr>
        <tr>
          <td className="text-xl underline text-left">Merkle Root: </td>
          <td className="text-xl">{shorten(toHex(publicInputs[1]))}</td>
        </tr>
        <tr>
          <td className="text-xl underline text-left">Blacklist Root: </td>
          <td className="text-xl">{shorten(toHex(publicInputs[2]))}</td>
        </tr>
        <tr>
          <td className="text-xl underline text-left">Blacklisted Commitments: </td>
          <td className="text-xl "><button className="underline" onClick={() => {setBlacklistExpanded(!blacklistExpanded)}}>{blacklistExpanded ? "Click to close":"Click to open"}</button></td>
        </tr>
        {blacklistExpanded && <tr>
          <td className="text-xl underline text-left"></td>
          <td className="text-xl">
            {blacklist.map((commitment, index) => {
              return <p key={index}>{shorten(toHex(commitment))}</p>
            })}
          </td>
        </tr>}
      </tbody>
      </table>
    </>
  );
  }