/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import { expect } from "chai";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-extraneous-import
import { ZKPClient } from "circuits";
import fs from "fs";
import path from "path";

describe("Test zkp circuit and scripts", function () {
  const privKey =
    "0xABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12ABCDEF12";
  let client: ZKPClient;
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
  xit("Should able to get the deposit data", async function () {
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
  it("Shoul be able do generate input for circuit", async function () {
    const proofStr = await client.calculateProofFromNote(note, (proof) => {});
    console.log(proofStr);
    // expect(proofStr).to.eq('{"root":"12234952384110039586942345580608651398262140514571053841722045944635960295416","nullifierHash":"18610117251467096985562627588015494431543472655911885532028554152283417606137","nullifier":"151052374976857256779382228662889992211301175891791728386072005777582759908","secret":"447466772515629871883478006777385118367831111104204347150961251810320277610","pathElements":["6409123665028084772185629034261100073122436375302325830225122756513366035692","19579768138719236911268373797961878269075779273992403037166535730293085723342","10982643202946117602874923539780885998291351996139506044127359437838027457975","3328546974345114324802666237325796749222263191569492506313607088167476003435","14097076369666538159157109475962067387665150603589476752019827009894526625407","20013144631875170005542894290824968371756160411515969205349070927285682589581","13884808750876818799110154725352465062649151577871810084506062675698564042481","9627343566951814893925147242172293914212343329877677340190109805323834061325","17440453581928170538827068001614715408836967346784620314972526628045457241006","14916053151134328770039389088003072404977847311981253501063546478388537961174","5144334193931071161095333443365958709723667866802993651536279237901158860655","16553027604636774981996523067890664169693644084796313122341481548549453857965","3751521175800258126937691225816353046058603051947507303531142277482062813347","10305986332068967361216168473292088175374669274141426830638827846047023318469","8697310796973811813791996651816817650608143394255750603240183429036696711432","9001816533475173848300051969191408053495003693097546138634479732228054209462","13882856022500117449912597249521445907860641470008251408376408693167665584212","6167697920744083294431071781953545901493956884412099107903554924846764168938","16572499860108808790864031418434474032816278079272694833180094335573354127261","11544818037702067293688063426012553693851444915243122674915303779243865603077"],"pathIndices":[1,0,0,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0]}');
    const blacklistStr = [
      "12234952384110039586942345580608651398262140514571053841722045944635960295416",
      "12234952384110039586942345580608651398262140514571053841722045944635960295417",
      "12234952384110039586942345580608651398262140514571053841722045944635960295418",
      // "17294904080838557775780501252825625192830525294365872549519147069289216287581"
    ]

    const input = await client.addBlacklist(proofStr, blacklistStr.join("\n"));
    console.log(input);
  });
});
