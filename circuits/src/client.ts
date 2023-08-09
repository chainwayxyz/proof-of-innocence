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
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
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

  async calculateProofFromNote(
    noteString: string,
    setProgress: Function
  ): Promise<string> {
    const { currency, amount, netId, deposit } = this.parseNote(noteString);
    const { subgraph } =
      this.initContract(netId, currency, amount);
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

  // async addBlacklist(proofInputSring: string, blacklist: string): Promise<string> {
  //   // unstringify the proof input
  //   const proofInput = JSON.parse(proofInputSring);
  //   // split blacklist by new line and remove empty lines
  //   const blacklistArray = blacklist.split('\n').filter((item) => item !== '');
  //   const tree = new MerkleTree((l,r)=>this.simpleHash(l,r), '21663839004416932945382355908790599225266501822907911457504978515578255421292', 254 + 1);
  //   for (let i = 0; i < blacklistArray.length; i++) {
  //       tree.setLeaf(BigInt(blacklistArray[i]), '1');
  //   }
  //   const {pathElements, pathIndices, root} = tree.getWitness(BigInt(proofInput.commitment));
  //   proofInput.blacklistRoot = root;
  //   proofInput.blacklistPathElements = pathElements;
  //   proofInput.blacklistPathIndices = pathIndices;
  //   // delete commitment from proof input
  //   delete proofInput.commitment;
  //   console.log(proofInput);
  //   console.log("Calculate WTNS Bin");
  //   const wtns = await this.calculator.calculateWTNSBin(proofInput, 0);
  //   console.log("Calculate Proof");
  //   const { proof:proofOutput } = await snarkjs.groth16.prove(this._zkey, wtns);
  //   console.log('Proof generated');
  //   console.log(proofOutput);
  //   const proofData = {
  //     a: [proofOutput.pi_a[0], proofOutput.pi_a[1]] as [bigint, bigint],
  //     b: [proofOutput.pi_b[0].reverse(), proofOutput.pi_b[1].reverse()] as [
  //       [bigint, bigint],
  //       [bigint, bigint]
  //     ],
  //     c: [proofOutput.pi_c[0], proofOutput.pi_c[1]] as [bigint, bigint],
  //   } as Proof;

  //   const returnData = {proof: proofData,
  //     publicInputs:[proofInput.root, proofInput.nullifierHash, proofInput.blacklistRoot],
  //     blacklist: blacklistArray
  //   };
  //   return JSON.stringify(returnData);
  // }

  async addBlacklist(
    proofInputString: string,
    blacklist: string,
  ): Promise<string> {
    // unstringify the proof input
    const proofInput = JSON.parse(proofInputString);
    // split blacklist by new line and remove empty lines
    const blacklistArray = blacklist.split("\n").filter((item) => item !== "");
    console.log('this is our blacklist: ', blacklistArray);
    console.log('####################');
    console.log('this is our commitment: ', proofInput.commitment);
    let temp = [];
    for (var elem of this._events) {
      temp.push(BigInt(elem.commitment).toString(10));
    }
    console.log('####################');
    console.log('this is our temp: ', temp);
    const idx = temp.indexOf(proofInput.commitment);
    console.log('this is our index: ', idx);
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
    const { pathElements, pathRoot } = tree.path(idx);
    proofInput.blacklistRoot = pathRoot;
    proofInput.blacklistPathElements = pathElements;
    // proofInput.blacklistPathIndices = pathIndices;
    // delete commitment from proof input
    delete proofInput.commitment;
    console.log("PROOF INPUT = \n", JSON.stringify(proofInput));
    console.log("Calculate WTNS Bin");
    const wtns = await this.calculator.calculateWTNSBin(proofInput, 0);
    console.log("Calculate Proof");
    const { proof: proofOutput } = await snarkjs.groth16.prove(
      this._zkey,
      wtns
    );
    console.log("Proof generated");
    console.log(proofOutput);
    const proofData = {
      a: [proofOutput.pi_a[0], proofOutput.pi_a[1]] as [bigint, bigint],
      b: [proofOutput.pi_b[0].reverse(), proofOutput.pi_b[1].reverse()] as [
        [bigint, bigint],
        [bigint, bigint]
      ],
      c: [proofOutput.pi_c[0], proofOutput.pi_c[1]] as [bigint, bigint],
    } as Proof;

    const returnData = {
      proof: proofData,
      publicInputs: [
        proofInput.root,
        proofInput.nullifierHash,
        proofInput.blacklistRoot,
      ],
      blacklist: blacklistArray,
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

  async generateMerkleProofwithAllowlist(deposit: Deposit, blacklist: string) {
    const blacklistArray = blacklist.split("\n").filter((item) => item !== "");
    // convert blacklist array to set
    const blacklistSet = new Set(blacklistArray);
    let leafIndex = -1;
    const leaves = this._events
      .sort((a, b) => a.leafIndex - b.leafIndex)
      .map((event) => {
        if (event.commitment === deposit.commitmentHex) {
          leafIndex = event.leafIndex;
        }
        if (!blacklistSet.has(event.commitment)) {
          return ZKPClient.ZERO_VALUE;
        }
        // convert event.commitment to BigInt
        return BigInt(event.commitment).toString(10);
      });
    // split blacklist by new line and remove empty lines
    // const allowlist = [];
    // for (let i = 0; i < leaves.length; i++) {
    //   if (blacklistArray.includes(leaves[i])) {
    //     allowlist.push(leaves[i]);
    //   } else {
    //     allowlist.push(ZKPClient.ZERO_VALUE);
    //   }
    // }
    const tree = new merkleTree(ZKPClient.MERKLE_TREE_HEIGHT, leaves, {
      hashFunction: (l, r) => this.simpleHash(l, r),
      zeroElement: ZKPClient.ZERO_VALUE,
    });
    const root = tree.root;
    const { pathElements, pathIndices } = tree.path(leafIndex);
    console.log("Second Merkle Tree path root: ", root);
    return { root, pathElements, pathIndices };
  }

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
      a: [proofOutput.pi_a[0], proofOutput.pi_a[1]] as [bigint, bigint],
      b: [proofOutput.pi_b[0].reverse(), proofOutput.pi_b[1].reverse()] as [
        [bigint, bigint],
        [bigint, bigint]
      ],
      c: [proofOutput.pi_c[0], proofOutput.pi_c[1]] as [bigint, bigint],
    } as Proof;
    const { proof } = this.toSolidityInput(proofData);
    const args = [
      this.toHex(BigInt(input.root)),
      this.toHex(input.nullifierHash),
    ];
    return { proof, args };
  }

  toSolidityInput(proof: Proof) {
    const flatProof: bigint[] = utils.unstringifyBigInts([
      proof.a[0],
      proof.a[1],
      proof.b[0][1],
      proof.b[0][0],
      proof.b[1][1],
      proof.b[1][0],
      proof.c[0],
      proof.c[1],
    ]);
    const result = {
      proof: "0x" + flatProof.map((x) => this.toHex32(x)).join(""),
    };
    return result;
  }
}
