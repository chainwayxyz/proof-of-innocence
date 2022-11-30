/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import { expect } from "chai";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-extraneous-import
import { ZKPClient, EdDSA } from "circuits";
import fs from "fs";
import path from "path";

describe("Test zkp circuit and scripts", function () {
  const privKey =
    "0xABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12";
  let client: ZKPClient;
  let eddsa: EdDSA;
  let note: string;
  beforeEach(async () => {
    note = "tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd";
    // note = "tornado-eth-0.1-5-0x54e1d5412ccd751a5e0667e836e770dfe556207a8cc1fdc432540a386f1d8f80ee26ccf790d041ef4439c62a5880ecf1b0585e00f67795646d3099d7ad02";
    const wasm = fs.readFileSync(
      path.join(__dirname, "../../circuits/zk/circuits/main_js/main.wasm")
    );
    const zkey = fs.readFileSync(
      path.join(__dirname, "../../circuits/zk/zkeys/main.zkey")
    );
    client = await new ZKPClient().init(wasm, zkey);
    eddsa = await new EdDSA(privKey).init();
  });
  xit("Should able to prove and verify the zkp", async function () {
    const message = BigNumber.from(
      "0xABCDEF00ABCDEF00ABCDEF00ABCDEF00ABCDEF00ABCDEF00ABCDEF00ABCDEF00"
    );
    const signature = await eddsa.sign(message);
    expect(await eddsa.verify(message, signature, eddsa.pubKey)).to.eq(true);
    const proof = await client.prove({
      M: message.toBigInt(),
      Ax: eddsa.scalarPubKey[0],
      Ay: eddsa.scalarPubKey[1],
      S: signature.S,
      R8x: eddsa.babyjub.F.toObject(signature.R8[0]),
      R8y: eddsa.babyjub.F.toObject(signature.R8[1]),
    });
    expect(proof).not.to.eq(undefined);
  });
  xit("Should able to parse note", async function () {
    const parsedNote = await client.parseNote(note);
    expect(parsedNote).not.to.eq(undefined);
    // parsedNoe.currency should be "eth"
    expect(parsedNote.currency).to.eq("eth");
    // parsedNoe.amount should be 0.1
    expect(parsedNote.amount).to.eq("0.1");
    // parsedNoe.netId should be 5
    expect(parsedNote.netId).to.eq(5);
    // parsedNoe.deposit should be an object
    expect(parsedNote.deposit).not.to.eq(undefined);
    // parsedNoe.deposit.nullifierHex should be "0x2924f3fdbdd6c6559bbd4c1926934ba25261f76db5f4bc470f7594deb503f7f9"
    expect(parsedNote.deposit.nullifierHex).to.eq("0x2924f3fdbdd6c6559bbd4c1926934ba25261f76db5f4bc470f7594deb503f7f9");
    // parsedNoe.deposit.commitmentHex should be "0x604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd"
    expect(parsedNote.deposit.commitmentHex).to.eq("0x263c919dec05271f99bbc03ad12de7fd90102664ab4439f9ba5e36f6bdf7235d");
  });
  xit("Should find the correct contract address", async function () {
    const { currency, amount, netId, deposit } = client.parseNote(note);
    const {tornadoAddress, tornadoInstance, deployedBlockNumber, subgraph} = client.initContract(netId, currency, amount);
    // tornadoAddress should be "0x454d870a72e29d5e5697f635128d18077bd04c60"
    expect(tornadoAddress).to.eq("0x454d870a72e29d5e5697f635128d18077bd04c60");
    // tornadoInstance should be "0x6Bf694a291DF3FeC1f7e69701E3ab6c592435Ae7"
    expect(tornadoInstance).to.eq("0x6Bf694a291DF3FeC1f7e69701E3ab6c592435Ae7");
    // deployedBlockNumber should be 3782581
    expect(deployedBlockNumber).to.eq(3782581);
    // subgraph should be "https://api.thegraph.com/subgraphs/name/tornadocash/goerli-tornado-subgraph"
    expect(subgraph).to.eq("https://api.thegraph.com/subgraphs/name/tornadocash/goerli-tornado-subgraph");
  });
  it("Should able to get the deposit data", async function () {
    const { currency, amount, netId, deposit } = client.parseNote(note);
    const {tornadoAddress, tornadoInstance, deployedBlockNumber, subgraph} = client.initContract(netId, currency, amount);
    const result = await client.queryLatestIndex(currency, amount, subgraph);
    console.log("Last deposit timestamp: ", result);
    expect(result).not.to.eq(undefined);
    // await client.quertFromRPC(tornadoInstance, deployedBlockNumber);
    await client.fetchGraphEvents(currency, amount, subgraph, (_) => {});
    const events = client.getEvents();

    expect(events).not.to.eq(undefined);
    expect(events.length).to.be.greaterThan(100);
    const {root, pathElements, pathIndices} = await client.generateMerkleProof(deposit, currency, amount);
    expect(root).not.to.eq(undefined);
    expect(pathElements).not.to.eq(undefined);
    expect(pathIndices).not.to.eq(undefined);

    const {proof, args} = await client.generateProof(root as string, pathElements as string[], pathIndices, deposit);
    console.log(proof);
    console.log(args);

  });
});
