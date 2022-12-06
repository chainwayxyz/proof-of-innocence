import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Verifier,
  Verifier__factory,
  ZkApp,
  ZkApp__factory,
} from "../typechain";
import { ZKPClient } from "circuits";
import fs from "fs";
import path from "path";

describe("Test ZKP contract", function () {
  let verifier: Verifier;
  let zkApp: ZkApp;
  let deployer: SignerWithAddress;
  let client: ZKPClient;
  let proofStr: string;
  // let eddsa: EdDSA;
  this.beforeEach(async () => {
    proofStr = '{"proof":{"a":["17888266192886688430442438181472587985114541994622554380724711648739065377162","13426929723821693819218479183984962092233348080978284215944137589469276149806"],"b":[["5051304075907731197268219509731719005968412136432759222713974311019824279643","14607220170982556259964429283983744286209536461050366041525652857079372197619"],["5267142103493674819234639449367157978843223647023655820257961668077924048350","7208617676381111804864140289848371753356384899861650132667219485516381399081"]],"c":["21225508455993955161082232862437120972007834221366420287710254720838184251122","8197436881013225431510410858664182727024829802565532059208639768037426887540"]},"publicInputs":["18342889726615621754930149633316846535446387656672537520332590466853966368377","2455504436323946471931213720480919070689988156858538961983810254059882498081","18610117251467096985562627588015494431543472655911885532028554152283417606137"],"blacklist":["12234952384110039586942345580608651398262140514571053841722045944635960295416","12234952384110039586942345580608651398262140514571053841722045944635960295418"]}';
    [deployer] = await ethers.getSigners();
    verifier = await new Verifier__factory(deployer).deploy();
    // console.log(verifier.address);
    zkApp = await new ZkApp__factory(deployer).deploy(verifier.address);
    client = await new ZKPClient().init(
      fs.readFileSync(
        path.join(__dirname, "../../circuits/zk/circuits/main_js/main.wasm")
      ),
      fs.readFileSync(path.join(__dirname, "../../circuits/zk/zkeys/main.zkey"))
    );
  });
  it("Should able to verify a zkp", async function () {
    // get proof from proofStr
    const proofData = JSON.parse(proofStr)
    const proof = proofData.proof;
    const publicInputs = proofData.publicInputs;
    console.log(proof);
    console.log(publicInputs);
    console.log(await zkApp.verify([publicInputs[0], publicInputs[1], publicInputs[2]], proof));
    console.log(await zkApp.verify([publicInputs[0], publicInputs[2], publicInputs[1]], proof));
    console.log(await zkApp.verify([publicInputs[1], publicInputs[0], publicInputs[2]], proof));
    console.log(await zkApp.verify([publicInputs[1], publicInputs[2], publicInputs[0]], proof));
    console.log(await zkApp.verify([publicInputs[2], publicInputs[0], publicInputs[1]], proof));
    console.log(await zkApp.verify([publicInputs[2], publicInputs[1], publicInputs[0]], proof));
    // expect(
    //   await zkApp.verify(
    //     publicInputs,
    //     proof
    //   )
    // ).to.eq(true);
  });
});
