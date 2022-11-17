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
  beforeEach(async () => {
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
  it("Should able to parse note", async function () {
    const note =
      "tornado-eth-0.1-5-0xe49f60b5be7853c9d2af9db59eba98a7280f3b8908c339e6452bc0fb1b7e556a604fd9f824961956e4c8b881c5274ce36c11683070c749120e660cd941fd";
    const parsedNote = await client.parseNote(note);
    expect(parsedNote).not.to.eq(undefined);
    console.log(parsedNote.deposit.commitmentHex)
  });
});
