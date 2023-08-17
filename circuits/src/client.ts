import buildCalculator from "../zk/circuits/main_js/witness_calculator";
import { buildBabyjub, buildPedersenHash, buildMimcSponge } from "circomlibjs";
import { utils } from "ffjavascript";
// import * as circomlibjs from "circomlibjs";
import * as snarkjs from "snarkjs";
// import config
import { config, tornadoInstanceABI } from "./config";

import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse } from "axios";
import merkleTree, { Element } from "fixed-merkle-tree";
import { ethers } from "ethers";

// import { MerkleTree, Witness } from "./MerkleTree";

// import path and fs
import path from "path";
import fs from "fs";

export interface Proof {
  pi_a: [bigint, bigint];
  pi_b: [[bigint, bigint], [bigint, bigint]];
  pi_c: [bigint, bigint];
}

export interface Deposit {
  nullifier: bigint;
  secret: bigint;
  preimage: Buffer;
  commitment: bigint;
  commitmentHex: string;
  nullifierHash: bigint;
  nullifierHex: string;
}

export interface Event {
  blockNumber: number;
  transactionHash: string;
  commitment: string;
  leafIndex: number;
  timestamp: string;
}

export class ZKPClient {
  private _calculator: any;
  private _babyjub: any;
  private _zkey: any;
  private _pedersen: any;
  private _mimcsponge: any;
  private _events: Array<Event> = [];
  // private _rpc: string = "";
  private static MERKLE_TREE_HEIGHT = 20;
  private static ZERO_VALUE =
    "21663839004416932945382355908790599225266501822907911457504978515578255421292";

  process: number = 0;

  get initialized() {
    return (
      this._calculator !== undefined &&
      this._babyjub !== undefined &&
      this._pedersen !== undefined &&
      this._zkey !== undefined
    );
  }

  get babyjub() {
    if (!this.initialized) throw Error("Not initialized");
    return this._babyjub;
  }

  get calculator() {
    if (!this.initialized) throw Error("Not initialized");
    return this._calculator;
  }

  async init(wasm: Buffer, zKey: Buffer) {
    if (this.initialized) return this;
    // you can adjust the file path here
    [this._zkey, this._calculator, this._babyjub] = await Promise.all([
      zKey,
      buildCalculator(wasm),
      buildBabyjub(),
    ]);
    this._zkey.type = "mem";
    this._pedersen = await buildPedersenHash();
    this._mimcsponge = await buildMimcSponge();
    // this._rpc = "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
    return this;
  }

  // this is used in main.test.ts, Prove.tsx and TornadoNote.tsx
  async calculateProofFromNote(
    noteString: string,
    setProgress: Function
  ): Promise<string> {
    const { currency, amount, netId, deposit } = this.parseNote(noteString);
    const { subgraph } = this.initContract(netId, currency, amount);
    // await client.quertFromRPC(tornadoInstance, deployedBlockNumber);
    await this.fetchGraphEvents(currency, amount, subgraph, setProgress);

    const { root, pathElements, pathIndices } = await this.generateMerkleProof(
      deposit
    );

    const inputJson = this.generateInputFirstPart(
      root as string,
      pathElements as string[],
      pathIndices,
      deposit
    );
    return inputJson;
  }

  // this is used in Verify.tsx
  getMerkleRoot(blacklistArray: string[]) {
    const blacklistSet = new Set(blacklistArray);
    const leaves = this._events
      .sort((a, b) => a.leafIndex - b.leafIndex)
      .map((event) => {
        if (!blacklistSet.has(event.commitment)) {
          return ZKPClient.ZERO_VALUE;
        }
        // convert event.commitment to BigInt
        return BigInt(event.commitment).toString(10);
      });
    const tree = new merkleTree(ZKPClient.MERKLE_TREE_HEIGHT, leaves, {
      hashFunction: (l, r) => this.simpleHash(l, r),
      zeroElement: ZKPClient.ZERO_VALUE,
    });
    return tree.root;
  }

  // this is used in main.test.ts, Prove.tsx and TornadoNote.tsx
  async addBlacklist(
    proofInputString: string,
    blacklist: string
  ): Promise<string> {
    // unstringify the proof input
    const proofInput = JSON.parse(proofInputString);
    // split blacklist by new line and remove empty lines
    const blacklistArray = blacklist.split("\n").filter((item) => item !== "");
    console.log("this is our blacklist: ", blacklistArray);
    const blacklistSet = new Set(blacklistArray);
    console.log("####################");
    console.log("this is our commitment: ", proofInput.commitment);
    const allowlist = [];
    for (var elem of this._events) {
      if (!blacklistSet.has(elem.commitment)) {
        allowlist.push(BigInt(elem.commitment).toString(10));
      }
    }
    const bitAllowlist = this.createBitAllowlistfromEvents(blacklistArray);
    console.log("this is our bit allowlist: ", bitAllowlist);
    // console.log("this is our allowlist: ", allowlist);
    const idx = allowlist.indexOf(proofInput.commitment);

    console.log("this is our index: ", idx);
    if (idx == -1) {
      throw new Error("Commitment is in blacklist");
    }
    const tree = new merkleTree(ZKPClient.MERKLE_TREE_HEIGHT, allowlist, {
      hashFunction: (l, r) => this.simpleHash(l, r),
      zeroElement: ZKPClient.ZERO_VALUE,
    });
    const { pathElements, pathIndices, pathRoot } = tree.path(idx);
    console.log("%%%%%%%%%%%%%%%%%%%%%");
    console.log("Path root: ", pathRoot);
    console.log("%%%%%%%%%%%%%%%%%%%%%");
    console.log("Path elements: ", pathElements);
    console.log("%%%%%%%%%%%%%%%%%%%%%");
    console.log("Path indices: ", pathIndices);
    console.log("%%%%%%%%%%%%%%%%%%%%%");
    proofInput.root = pathRoot;
    proofInput.pathElements = pathElements;
    proofInput.pathIndices = pathIndices;
    // delete commitment from proof input
    delete proofInput.commitment;
    console.log("PROOF INPUT = \n", JSON.stringify(proofInput));
    console.log("Calculate WTNS Bin");
    const wtns = await this.calculator.calculateWTNSBin(proofInput, 0);
    console.log("Calculate Proof");
    const { proof, publicSignals } = await snarkjs.groth16.prove(
      this._zkey,
      wtns
    );
    console.log("Proof generated");
    console.log("this is proof output: ", proof);
    console.log("this is public signals: ", publicSignals);

    // const proofData = {
    //   pi_a: [proofOutput.pi_a[0], proofOutput.pi_a[1]] as [bigint, bigint],
    //   pi_b: [proofOutput.pi_b[0], proofOutput.pi_b[1]] as [
    //     [bigint, bigint],
    //     [bigint, bigint]
    //   ],
    //   pi_c: [proofOutput.pi_c[0], proofOutput.pi_c[1]] as [bigint, bigint],
    // } as Proof;
    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("Proof data: ", proof);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
    const returnData = {
      proof: proof,
      publicSignals: publicSignals,
      bitAllowlist: bitAllowlist,
    };
    return JSON.stringify(returnData);
  }

  /** Compute pedersen hash */
  pedersenHash(data: Buffer): bigint {
    return this._babyjub.F.toObject(
      this._babyjub.unpackPoint(Buffer.from(this._pedersen.hash(data)))[0]
    );
  }

  /** Compute mimc hash */
  simpleHash(left: Element, right: Element): string {
    return this._mimcsponge.F.toString(
      this._mimcsponge.multiHash([
        this._mimcsponge.F.e(BigInt(left)),
        this._mimcsponge.F.e(BigInt(right)),
      ])
    ).toString();
  }

  toHex(num: bigint, length: number = 32): string {
    return "0x" + num.toString(16).padStart(length * 2, "0");
  }

  toHex32(num: bigint): string {
    let str = num.toString(16);
    while (str.length < 64) str = "0" + str;
    return str;
  }

  createDeposit(nullifier: bigint, secret: bigint): Deposit {
    const preimage = Buffer.concat([
      Buffer.from(utils.leInt2Buff(nullifier, 31)),
      Buffer.from(utils.leInt2Buff(secret, 31)),
    ]);
    const commitment = this.pedersenHash(preimage);
    const commitmentHex = this.toHex(commitment);
    console.log("Your commitment: ", commitmentHex);
    const nullifierHash = this.pedersenHash(utils.leInt2Buff(nullifier, 31));
    const nullifierHex = this.toHex(nullifierHash);
    return {
      nullifier,
      secret,
      preimage,
      commitment,
      commitmentHex,
      nullifierHash,
      nullifierHex,
    };
  }

  parseNote(noteString: string): {
    currency: string;
    amount: string;
    netId: number;
    deposit: Deposit;
  } {
    const noteRegex =
      /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g;
    const match = noteRegex.exec(noteString);
    if (!match) {
      throw new Error("Invalid note");
    }

    const note = match.groups?.note;
    if (!note) {
      throw new Error("Invalid note");
    }
    const netId = parseInt(match.groups?.netId || "0");
    const currency = match.groups?.currency || "";
    const amount = match.groups?.amount || "0";
    const noteBytes = Buffer.from(note, "hex");
    const nullifier = utils.leBuff2int(noteBytes.slice(0, 31));
    const secret = utils.leBuff2int(noteBytes.slice(31, 62));
    const deposit = this.createDeposit(nullifier, secret);

    return {
      currency,
      amount,
      netId,
      deposit,
    };
  }

  initContract(netId: number, currency: string, amount: string) {
    const net =
      config.deployments[`netId${netId}` as keyof typeof config.deployments];
    const tornadoAddress = net.proxy;
    const subgraph = net.subgraph;
    const instance = net[currency as keyof typeof net];
    const instanceAdresses =
      instance["instanceAddress" as keyof typeof instance];
    const tornadoInstance =
      instanceAdresses[amount as keyof typeof instanceAdresses];
    const deployedBlockNumbers =
      instance["deployedBlockNumber" as keyof typeof instance];
    const deployedBlockNumber =
      deployedBlockNumbers[amount as keyof typeof deployedBlockNumbers];

    return { tornadoAddress, tornadoInstance, deployedBlockNumber, subgraph };
  }

  async queryLatestIndex(currency: string, amount: string, subgraph: string) {
    const variables = {
      currency: currency.toString(),
      amount: amount.toString(),
    };
    const query = {
      query: `
      query($currency: String, $amount: String){
        deposits(first: 1, orderBy: index, orderDirection: desc, where: {currency: $currency, amount: $amount}) {
          index
        }
      }
      `,
      variables,
    };
    const querySubgraph = await axios.post(subgraph, query);
    const queryResult = querySubgraph.data.data.deposits;
    const result = queryResult[0].index;
    return Number(result);
  }

  async queryFromGraph(
    currency: string,
    amount: string,
    subgraph: string,
    index: string
  ) {
    const variables = {
      currency: currency.toString(),
      amount: amount.toString(),
      index: index,
    };
    const query = {
      query: `
      query($currency: String, $amount: String, $index: String){
        deposits(orderBy: index, first: 1000, where: {currency: $currency, amount: $amount, index_gte: $index}) {
          blockNumber
          transactionHash
          commitment
          index
          timestamp
        }
      }
      `,
      variables,
    };
    const querySubgraph = await axios.post(subgraph, query, {});
    const queryResult = querySubgraph.data.data?.deposits || [];

    let mapResult = queryResult.map(
      ({
        blockNumber,
        transactionHash,
        commitment,
        index,
        timestamp,
      }: {
        blockNumber: string;
        transactionHash: string;
        commitment: string;
        index: string;
        timestamp: string;
      }) => ({
        blockNumber: Number(blockNumber),
        transactionHash: transactionHash,
        commitment: commitment,
        leafIndex: Number(index),
        timestamp: timestamp,
      })
    );
    return mapResult;
  }

  async fetchGraphEvents(
    currency: string,
    amount: string,
    subgraph: string,
    setProgress: Function
  ) {
    this._events = [];
    const latestIndex = await this.queryLatestIndex(currency, amount, subgraph);
    for (let index = "0"; ; ) {
      const result = await this.queryFromGraph(
        currency,
        amount,
        subgraph,
        index
      );
      if (Object.keys(result).length === 0) {
        setProgress(90);
        break;
      } else {
        const curIndex = result[result.length - 1].leafIndex;
        const progress = (90 * (curIndex + 1)) / latestIndex;
        setProgress(progress);
        index = String(curIndex + 1);
        const resultBlock = result[result.length - 1].blockNumber;
        const resultTimestamp = result[result.length - 1].timestamp;
        await this.saveResult(result);
        console.log(
          "Fetched",
          amount,
          currency.toUpperCase(),
          "deposit",
          "events to block:",
          Number(resultBlock),
          "timestamp:",
          Number(resultTimestamp)
        );
      }
    }
    console.log("Length = ", this._events.length);

    // save events to file
    // const filePath = '/Users/ekrembal/Documents/chainway/denemeler/proof-of-innocence/circuits/test/100ETH_events.json';
    // const events = JSON.stringify(this._events);
    // fs.writeFileSync(filePath, events);
    // return lastBlock;
  }

  async saveResult(result: Array<Event>) {
    this._events = this._events.concat(result);
    this.process = this._events.length;
  }

  getEvents() {
    return this._events;
  }

  // this is used in main.test.ts
  async generateMerkleProof(deposit: Deposit) {
    let leafIndex = -1;
    const leaves = this._events
      .sort((a, b) => a.leafIndex - b.leafIndex)
      .map((event) => {
        if (event.commitment === deposit.commitmentHex) {
          leafIndex = event.leafIndex;
        }
        // convert event.commitment to BigInt
        return BigInt(event.commitment).toString(10);
      });
    console.log("leafIndex: ", leafIndex);
    const tree = new merkleTree(ZKPClient.MERKLE_TREE_HEIGHT, leaves, {
      hashFunction: (l, r) => this.simpleHash(l, r),
      zeroElement: ZKPClient.ZERO_VALUE,
    });
    const root = tree.root;
    const { pathElements, pathIndices } = tree.path(leafIndex);
    console.log("Path root: ", root);
    return { root, pathElements, pathIndices };
  }

  // this is used only here
  generateInputFirstPart(
    root: string,
    pathElements: Array<string>,
    pathIndices: Array<number>,
    deposit: Deposit
  ): string {
    const input = {
      commitment: deposit.commitment.toString(),
      root: root,
      nullifierHash: deposit.nullifierHash.toString(),
      nullifier: deposit.nullifier.toString(),
      secret: deposit.secret.toString(),
      pathElements: pathElements,
      pathIndices: pathIndices,
    };
    return JSON.stringify(input);
  }

  // returns {string, string[]}
  async generateProof(
    root: string,
    pathElements: Array<string>,
    pathIndices: Array<number>,
    deposit: Deposit
  ): Promise<{ proof: string; args: string[] }> {
    const input = {
      root: root,
      nullifierHash: deposit.nullifierHash,
      nullifier: deposit.nullifier,
      secret: deposit.secret,
      pathElements: pathElements,
      pathIndices: pathIndices,
    };
    console.log("input\n");
    console.log(input);
    console.log("Generating SNARK proof");
    const wtns = await this.calculator.calculateWTNSBin(input, 0);
    const { proof: proofOutput } = await snarkjs.groth16.prove(
      this._zkey,
      wtns
    );
    console.log("Proof generated");
    console.log(proofOutput);
    const proofData = {
      pi_a: [proofOutput.pi_a[0], proofOutput.pi_a[1]] as [bigint, bigint],
      pi_b: [proofOutput.pi_b[0].reverse(), proofOutput.pi_b[1].reverse()] as [
        [bigint, bigint],
        [bigint, bigint]
      ],
      pi_c: [proofOutput.pi_c[0], proofOutput.pi_c[1]] as [bigint, bigint],
    } as Proof;
    const { proof } = this.toSolidityInput(proofData);
    const args = [
      this.toHex(BigInt(input.root)),
      this.toHex(input.nullifierHash),
    ];
    return { proof, args };
  }

  createBitAllowlistfromEvents(blacklist: string[]) {
    const blacklistSet = new Set(blacklist);
    let allowlist: string = "";
    for (let i = 0; i < this._events.length; i++) {
      if (!blacklistSet.has(this._events[i].commitment)) {
        allowlist += "1";
      } else {
        allowlist += "0";
      }
    }
    return allowlist;
  }

  async verifyProof(input: string): Promise<boolean> {
    console.log("Verifying SNARK proof");
    // console.log("Input: ", input);
    const temp = JSON.parse(input);
    console.log("temp: ", temp);
    console.log("proofOut: ", temp.proof);
    console.log("publicSignals: ", temp.publicSignals);
    const root = temp.publicSignals[0];
    // console.log("bitAllowlist: ", temp.bitAllowlist);
    let allowlistFromBits = [];
    // console.log("allowlist: ", temp.bitAllowlist);
    for (let i = 0; i < temp.bitAllowlist.length; i++) {
      if (temp.bitAllowlist[i] == "1") {
        allowlistFromBits.push(BigInt(this._events[i].commitment).toString(10));
      }
    }
    const tree = new merkleTree(
      ZKPClient.MERKLE_TREE_HEIGHT,
      allowlistFromBits,
      {
        hashFunction: (l, r) => this.simpleHash(l, r),
        zeroElement: ZKPClient.ZERO_VALUE,
      }
    );
    // read vk from circuits/zk/zkeys/verificationkey.json
    const vk = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../zk/zkeys/verificationkey.json"),
        "utf8"
      )
    );
    console.log("VK: ", vk);
    console.log("Proof: ", temp.proof);
    const bool = await snarkjs.groth16.verify(
      vk,
      temp.publicSignals,
      temp.proof
    );
    //check root == tree.root() and groth verify
    console.log(root);
    console.log(tree.root);
    console.log(root == tree.root);
    console.log(bool);
    return root == tree.root && bool;
  }

  toSolidityInput(proof: Proof) {
    const flatProof: bigint[] = utils.unstringifyBigInts([
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][1],
      proof.pi_b[0][0],
      proof.pi_b[1][1],
      proof.pi_b[1][0],
      proof.pi_c[0],
      proof.pi_c[1],
    ]);
    const result = {
      proof: "0x" + flatProof.map((x) => this.toHex32(x)).join(""),
    };
    return result;
  }
}
