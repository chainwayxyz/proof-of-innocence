import buildCalculator from "../zk/circuits/main_js/witness_calculator";
import { buildBabyjub, buildPedersenHash, buildMimcSponge } from "circomlibjs";
import { utils } from "ffjavascript";
// import * as circomlibjs from "circomlibjs";
import * as snarkjs from "snarkjs";
// import config
import { config } from "./config";

import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios';
import merkleTree, { Element } from "fixed-merkle-tree";

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
  blockNumber: number,
  transactionHash: string,
  commitment: string,
  leafIndex: number,
  timestamp: string
}


export class ZKPClient {
  private _calculator: any;
  private _babyjub: any;
  private _zkey: any;
  private _pedersen:any;
  private _mimcsponge: any;
  private _events: Array<Event> = [];
  private static MERKLE_TREE_HEIGHT = 20;


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
    return this;
  }

  // async init() {
  //   if (this.initialized) return this;
  //   this._babyjub = await buildBabyjub();
  //   this._pedersen = await PedersenHash(this._babyjub);
  //   return this;
  // }

  /** Compute pedersen hash */
  pedersenHash(data: Buffer): bigint {
    return this._babyjub.F.toObject(this._babyjub.unpackPoint(Buffer.from(this._pedersen.hash(data)))[0]);
    console.log("Pedersen hash result:");
    console.log(this._pedersen.hash(data));
    console.log("Input to Baby JUBJUB is:")
    console.log(Buffer.from(this._pedersen.hash(data)));
    console.log("OUTPUT of baby jub jub is:");
    console.log(this._babyjub.unpackPoint(Buffer.from(this._pedersen.hash(data)))[0]);
    const babyjubOutput = this._babyjub.unpackPoint(Buffer.from(this._pedersen.hash(data)))[0];
    console.log("BIGINT output:");
    console.log(babyjubOutput);
    console.log(Buffer.from(babyjubOutput));
    console.log(utils.beBuff2int(Buffer.from(babyjubOutput)))
    console.log("this._babyjub.F.array2buffer(babyjubOutput)")
    console.log(this._babyjub.F.toObject(babyjubOutput));
    // convert output of BigInt
    const babyjubOutputBigInt = BigInt(babyjubOutput);
    console.log(babyjubOutputBigInt);
    return this._babyjub.unpackPoint(Buffer.from(this._pedersen.hash(data)))[0];
  }

  simpleHash(left:Element, right:Element): string {
    console.log("GELDI");
    console.log(left);
    console.log(right);
    return this._mimcsponge.F.toObject(this._mimcsponge.multiHash([utils.leInt2Buff(BigInt(left), 32), utils.leInt2Buff(BigInt(right), 32)])).toString();
    console.log("left: ", left);
    console.log("right: ", right);
    console.log("left buffer = ", utils.leInt2Buff(BigInt(left)));
    console.log("right buffer = ", utils.leInt2Buff(BigInt(right)));
    console.log(this._mimcsponge.hash);
    const hash = this._mimcsponge.multiHash([utils.leInt2Buff(BigInt(left), 32), utils.leInt2Buff(BigInt(right), 32)]);
    console.log("hash: ", hash);
    console.log("typeof hash: ", typeof hash);
    
    console.log(this._mimcsponge.F.toObject(hash));
    console.log(hash[0]);
    return "1";
    // return this._mimcsponge.multiHash([utils.leInt2Buff(BigInt(left)), utils.leInt2Buff(BigInt(right))]);
  }

  toHex(num: bigint): string {
    return "0x" + num.toString(16);
  }


  createDeposit(
    nullifier: bigint,
    secret: bigint
  ): Deposit {
    const preimage = Buffer.concat([utils.leInt2Buff(nullifier, 31), utils.leInt2Buff(secret, 31)]);
    const commitment = this.pedersenHash(preimage);
    const commitmentHex = this.toHex(commitment);
    const nullifierHash = this.pedersenHash(utils.leInt2Buff(nullifier, 31));
    const nullifierHex = this.toHex(nullifierHash);
    return { nullifier, secret, preimage, commitment, commitmentHex, nullifierHash, nullifierHex };
  }

  parseNote(
    noteString:string
    ): {
      currency: string,
      amount: string,
      netId: number,
      deposit: Deposit
    }{
    const noteRegex = /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g
    const match = noteRegex.exec(noteString);
    if(!match){
      throw new Error("Invalid note");
    }
  
    const note = match.groups?.note;
    if(!note){
      throw new Error("Invalid note");
    }
    const netId = parseInt(match.groups?.netId || "0");
    const currency = match.groups?.currency || "";
    const amount = match.groups?.amount || "0";
    const noteBytes = Buffer.from(note, 'hex');
    const nullifier = utils.leBuff2int(noteBytes.slice(0, 31));
    const secret = utils.leBuff2int(noteBytes.slice(31, 62));
    const deposit = this.createDeposit(nullifier, secret);

    return {
      currency,
      amount,
      netId,
      deposit
    };
  }

  initContract(
    netId: number,
    currency: string,
    amount:string
  ){
    const net = config.deployments[`netId${netId}` as keyof typeof config.deployments];
    const tornadoAddress = net.proxy;
    const subgraph = net.subgraph;
    const instance = net[currency as keyof typeof net];
    const instanceAdresses = instance["instanceAddress" as keyof typeof instance];
    const tornadoInstance = instanceAdresses[amount as keyof typeof instanceAdresses];
    const deployedBlockNumbers = instance["deployedBlockNumber" as keyof typeof instance];
    const deployedBlockNumber = deployedBlockNumbers[amount as keyof typeof deployedBlockNumbers];

    return {tornadoAddress, tornadoInstance, deployedBlockNumber, subgraph};
  }

  async queryLatestTimestamp(
    currency: string,
    amount: string,
    subgraph: string
  ){
    const variables = {
      currency: currency.toString(),
      amount: amount.toString()
    }
    const query = {
      query: `
      query($currency: String, $amount: String){
        deposits(first: 1, orderBy: timestamp, orderDirection: desc, where: {currency: $currency, amount: $amount}) {
          timestamp
        }
      }
      `,
      variables
    }
    const querySubgraph = await axios.post(subgraph, query);
    const queryResult = querySubgraph.data.data.deposits;
    const result = queryResult[0].timestamp;
    return Number(result);
  }

  async queryFromGraph(
    currency: string,
    amount: string,
    subgraph: string,
    timestamp: number
  ) {
    const variables = {
      currency: currency.toString(),
      amount: amount.toString(),
      timestamp: timestamp
    }
    const query = {
      query: `
      query($currency: String, $amount: String, $timestamp: Int){
        deposits(orderBy: timestamp, first: 1000, where: {currency: $currency, amount: $amount, timestamp_gt: $timestamp}) {
          blockNumber
          transactionHash
          commitment
          index
          timestamp
        }
      }
      `,
      variables
    }
    const querySubgraph = await axios.post(subgraph, query, {});
    const queryResult = querySubgraph.data.data?.deposits || [];

    const mapResult = queryResult.map(({ blockNumber , transactionHash, commitment, index, timestamp }:{blockNumber:string,transactionHash:string,commitment:string,index:string,timestamp:string }) => ({
      blockNumber: Number(blockNumber),
      transactionHash: transactionHash,
      commitment: commitment,
      leafIndex: Number(index),
      timestamp: timestamp
    }));

    return mapResult;
  }

  async fetchGraphEvents(
    currency: string,
    amount: string,
    subgraph: string,
  ){
    const latestTimestamp = await this.queryLatestTimestamp(currency, amount, subgraph);
    const firstTimestamp = 1605811082;
    for (let i = firstTimestamp; i < latestTimestamp;){
      // console.log("i: ", i);
      const result = await this.queryFromGraph(currency, amount, subgraph, i);
      // console.log("result: ", result);
      
      if (Object.keys(result).length === 0) {
        i = latestTimestamp;
      } else{
        i = Number(result[result.length-1].timestamp);
        const resultBlock = result[result.length - 1].blockNumber;
        const resultTimestamp = result[result.length - 1].timestamp;
        await this.saveResult(result);
        i = parseInt(resultTimestamp);
        console.log("Fetched", amount, currency.toUpperCase(), "deposit", "events to block:", Number(resultBlock), "timestamp:", Number(resultTimestamp));
        i = latestTimestamp;
        // console.log("result.length: ", result.length);
        // console.log(result[0]);
        // console.log(result[result.length - 1]);
      }
    }
    console.log("Length = ", this._events.length);
    // return events;
  }

  async saveResult(result: Array<Event>){
    this._events = this._events.concat(result);
  }



  async generateMerkleProof(
    deposit:Deposit,
    currency: string,
    amount: string,
  ) {
    let leafIndex = -1;
    const leaves = this._events.sort((a, b) => a.leafIndex - b.leafIndex).map((event) => {
      if (event.commitment === deposit.commitmentHex) {
        leafIndex = event.leafIndex;
      }
      // convert event.commitment to BigInt
      return Number(BigInt(event.commitment));
    });
    console.log("leafIndex: ", leafIndex);
    console.log(leaves);
    const tree = new merkleTree(ZKPClient.MERKLE_TREE_HEIGHT, leaves, {hashFunction: this.simpleHash, zeroElement: 0});
    const root = tree.root;
    console.log("root: ", root);
    const { pathElements, pathIndices } = tree.path(leafIndex);
    console.log("pathElements: ", pathElements);
    console.log("pathIndices: ", pathIndices);
  }

  /**
   * @dev customize this functions for your own circuit!
   */
  async prove({
    M,
    Ax,
    Ay,
    S,
    R8x,
    R8y,
  }: {
    M: bigint;
    Ax: bigint;
    Ay: bigint;
    S: bigint;
    R8x: bigint;
    R8y: bigint;
  }): Promise<Proof> {
    const inputs = {
      M,
      Ax,
      Ay,
      S,
      R8x,
      R8y,
    };
    const wtns = await this.calculator.calculateWTNSBin(inputs, 0);
    const { proof } = await snarkjs.groth16.prove(this._zkey, wtns);
    return {
      a: [proof.pi_a[0], proof.pi_a[1]] as [bigint, bigint],
      b: [proof.pi_b[0].reverse(), proof.pi_b[1].reverse()] as [
        [bigint, bigint],
        [bigint, bigint]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]] as [bigint, bigint],
    };
  }
}
