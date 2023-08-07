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
    if (!client) {
      setNoteError("Client not found");
      return;
    }
    try {
      setNoteError("");
      setIsLoading(true);
      setLoadingMsg("Fetching past deposit events...");
      const proofInputJson = await client.calculateProofFromNote(
        note,
        setProgress
      );
      setProofInput(proofInputJson);
      setProgress(100);
      setIsLoading(false);
      setProgress(0);
    } catch (e: any) {
      console.log(e);
      setNoteError(e.message as string);
      setIsLoading(false);
    }
  };

  const saveToIpfs = async (proof: string) => {
    const response = await axios.post(
      "https://proof-of-innocence.herokuapp.com/api",
      JSON.parse(proof)
    );
    return response.data["ipfsHash"];
  };

  const saveToIpfsButton = async () => {
    if (!proof) {
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
  };

  const downloadProofButton = async () => {
    if (!proof) {
      setBlacklistError("Proof not found");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([proof], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "proof.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const generateProof = async () => {
    if (!client) {
      setBlacklistError("Client not found");
      return;
    }
    try {
      setBlacklistError("");
      setIsLoading(true);
      setLoadingMsg("Generating ZK proof...");
      const proofWithBlacklist = await client.addBlacklist(
        proofInput,
        blacklist
      );
      setProof(proofWithBlacklist);
      setIsModalOpen(true);
      setIsLoading(false);
    } catch (e: any) {
      console.log(e);
      setBlacklistError(e.message as string);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (client) setIsLoading(false);
    else setLoadingMsg("This may take a while.");
  }, [client]);

  useEffect(() => {
    if (client) fetchNote();
  }, [note]);

  return (
    <>
      {isLoading && <Loading progress={progress} loadingMsg={loadingMsg} />}
      <p className="text-[#494f58] ps-2 pe-4 py-2 mb-4 bg-[#f8edca] text-start text-sm rounded-xl border-l-[12px] border-[#f0b90b]">
        This is a beta product. Don't use it with your mainnet Tornado Cash
        notes.
      </p>
      <div className="flex flex-col gap-y-4 text-slate-950">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <label htmlFor="note-field" className="font-regular">
              Note:
            </label>
            <button
              className="underline float-right text-sm"
              onClick={() =>
                setNote(
                  "tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd"
                )
              }
            >
              Use demo note
            </button>
          </div>
          <input
            id="note-field"
            className={`border px-2 py-1 rounded-lg w-full focus:outline-none bg-[#f7fafb] text-sm ${
              noteError ? "border-red-700" : ""
            }`}
            type="text"
            placeholder="Please enter your note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {noteError && <p className="text-red-700">{noteError}</p>}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <label htmlFor="blacklist-field" className="font-regular">
              Blacklist:
            </label>
            <button
              className="underline float-right text-sm"
              onClick={() =>
                setBlacklist(
                  "0x0ea2108f0418e56c1cb6fdb84991bcd485c0a46ca92a9d4c4d7f37f4b477c50a\n0x18d69979bc9af3e96f99dcee6231fcc0ea1a2f59a6199ae314bf525ceba19801\n0x0ad268c637364229e1a3bdc760a7e02c90f3e18035d7eb777c69e93c5f8969e3\n0x2aca2a095aab37e2869e6cfe834d8357b1491882735503fbd5ee38a576de3430\n0x0270405127849de1fe6ff6882206a4e59151fa43422403531db529fb63cf6d3b\n0x2f33adc8af6aaff6832f1051cada05db576893ce6533a1b9a6cc18e97378f0ea\n0x0215e026ca7fc6aa06707e483b3c4c93f6cf0d14a34498b81056012034fcf3fd\n0x2a6f5e7275be28b9e81dd50e88112ffc498089d7c513958adca12d6ded386b40\n0x190ecb67a8509b31d2e9d281d163c76ff13864e70784ba5fdb1d9f7c976a3f4f\n0x0ceea7b6c622a8a48e24e98fe694b13d6836d4d90b3697cee4b2f7e7ca9ba12d\n0x25e200bab9defcf75482d84b56fd2e7a659b764cd1e03b03273d4403e4e33d30\n0x057ca058961fbe15ccf99996cbd280dd43a23d30a5987761130da1cdb9912d2f\n0x1a26583afac297373dce75a749cbe9a8c5ffd23552becc3b6f9d9cfc38ec0147\n0x1f9dc16ed4e5cac714309d1562d14ed767531c45a0d8560f0053f708ce74e17f\n0x164739214569967fafb3dede0b582f6193aaa2b643113c8eab732041498f7301\n0x2a9b94e75cbe32b08b93d074df08ebe01d18b4b98374f926b227cf2b175b42aa\n0x228e1ec2815e1761d49c2a8ee896032b7298cdbd3f5209b02f2caaea723b4908\n0x05f3a3fd0ea08f8955c88fece58d512b9554656551b70e7f045971fa6493a3e7\n0x0552e5bdaef5807b6e899e483856afc2b321c5c5ad63bccebd6c53d8556e4cc1\n0x068b9e385281d29411788355f52cf0ff2c3170b7b6a5b60a65d03886484df281\n0x070b4e7d1802526eb6b688879038bb95f0cd639d67d265e043cd6df8f4e97ab2\n0x20ba4f6c6d87096cd28cc025c0be8629190e6a673fbdb9c25d83b68460ca2fc4\n0x1cded4d41e79c9fa49d58462eecb458fd29154fdd6c3aa89f0e505fd8f625a45\n0x262663ccb83b0836c8292b6dbd8b50772e73f074387247c4ef9a0389037863a2\n0x1a8c1190f62fed3e836e78ca9c2df7a2e9d2bb9acaa52924dd27329b3e801789\n0x25cc2597157ac20563abca98f5dfba53a2a7e80ec0685d282e16a80643d5eb6a\n0x0f634aaf3c1d304955b83c05ff9fd9cb17b8cfe37e7adc04d77402de2ff918a1\n0x2a971bf7a404afeb91e3101445cfe8a4cb5f5136425690080c20910f6e5217c0\n0x24e537d607705556d2cc1b93f56f1455608e6ba15a86e64cd828c4b29e012315\n0x1482e55635ca9bc33fab2d4b2da7dc1f5a2a297d08d28498345c4b467694bd51\n0x0efeec16a656d291ecbc3e1edf0640dace1d306b8b98b5e0aa2d3ed97160c738\n0x1595a91f0ba985906f5e6d2d73667c7223d795f62175fc1237485138ec605e41\n0x1f15fe5f26c70995999ac1307024783622f53888e7ffe04a5ca7e15add816304\n0x2d79cb67cd7ef6fca3418e185e762acae4e6e39f223fad2ae2ce9d79fda77e98\n0x18b6086d53417875074661aea9a85ee0b4f44a9811913a337ab44abdd8bfe265\n0x220d9b81a17d03324ee1260972919eb2b6ace8a633c9976d61b57254b8cfc9f3\n0x0ce7b58f43ac808a4129a9929966787006fd865cfa5a1afed267e11fc9793343\n0x04fe58ea7ae7d0a48df1ed55703187b3ecf60ca1d7b6c46017239916f328a149\n0x25a275949393c35d1c5e07a856cad7df48e8e4c8d05ea7bd741f8b77b2dbe2c4\n0x1c44546b872528e6befa0cbdd8077da653dca50b964f089e5e3eb49128327393\n0x17a64e4f63cfb877de479926d540983d0fd1d665656e50fd96ef160a42970848\n0x03e30f6d6a539380e11b2176104dae36e07f84f4e11644b80517fb075dd0568e\n0x2cf32baabddef43d46ab0a739f5bc942fe96c5ae8e67cecace21fa9db42620fd\n0x2ab7315e268a996a74f86f7a0db266cbafbbd3eca4384b6a280b723ba1247e21\n0x0d8a1437809301c71a7aedd3671a02246e8a084581cb829453d4f732a2084a69\n0x1b69467bfa302e8a9b72708c8e404af7fa25cf4d1b59ac5117c20ecfff6c363b\n0x01cf3a1b176762fbccc783d16bd2390b6382a7c80ca2a251d312056634e98585\n0x29dff56e188485cdabcb1029b2b46342a8273760c0fe801ce0b06d6650a8fb30\n0x2f1b8aea2e500d38fd041438c53436ad0db4c90daac474eb3a592922772dcd00\n0x1492cbc2bd064a7f2c212054b1b762930c7dbab86ba0da2d84716d74d3684f41\n0x1a3f09057ff0a8b67ff037d007c9795a6c377707e457b3cd2d3d883d96dbd846\n0x1b2e1d336f5e5fd7abfb83f367510aef18d33931cfe26a6d063614dd3dcc8971\n0x1a71f706577530dda77a7d577065d84bbb83613c36f315f426542ba387ccd920\n0x0b9f2d4b0eb05cc84bcc879319ad0868b301ca4e5a643e9b94666da06217b279\n0x1086da9eac947231eeb9a27405d1a983840eda2e05d5cde8678af6934fbccf57"
                )
              }
            >
              Use demo blacklist
            </button>
          </div>
          <textarea
            rows={5}
            id="blacklist-field"
            className={`border px-2 py-1 rounded-lg w-full focus:outline-none bg-[#f7fafb] min-h-[120px] text-sm ${
              blacklistError ? "border-red-700" : ""
            }`}
            placeholder="Enter blacklist commitments, one per line"
            value={blacklist}
            onChange={(e) => setBlacklist(e.target.value)}
          ></textarea>
          {blacklistError && (
            <p className="text-red-700 mt-2">{blacklistError}</p>
          )}
        </div>

        {isModalOpen && !isLoading && (
          <Modal
            setIsModalOpen={setIsModalOpen}
            modalContent={"Your proof is ready."}
            modalButtonsFunctions={[
              [downloadProofButton, "Download proof"],
              [saveToIpfsButton, "Save to IPFS"],
            ]}
          />
        )}

        <button
          className="inline-block font-normal border rounded-full shadow-md mb-8 mt-4 px-4 py-2 hover:bg-[#3F7474] hover:text-white hover:shadow-[#3F7474] hover:border-[#3F7474] ease-in-out duration-300"
          onClick={generateProof}
        >
          Generate Proof
        </button>
      </div>
    </>
  );
}

export default Prove;
