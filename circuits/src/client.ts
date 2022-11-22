import buildCalculator from "../zk/circuits/main_js/witness_calculator";
import { buildBabyjub, buildPedersenHash } from "circomlibjs";
import { utils } from "ffjavascript";
// import * as circomlibjs from "circomlibjs";
import * as snarkjs from "snarkjs";

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



export class ZKPClient {
  private _calculator: any;
  private _babyjub: any;
  private _zkey: any;
  private _pedersen:any;

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
      amount: number,
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
    const amount = parseFloat(match.groups?.amount || "0");
    const noteBytes = Buffer.from(note, 'hex');
    const nullifier = utils.leBuff2int(noteBytes.slice(0, 31));
    const secret = utils.leBuff2int(noteBytes.slice(31, 62));
    const deposit = this.createDeposit(nullifier, secret);
    console.log(deposit);

    return {
      currency,
      amount,
      netId,
      deposit
    };
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
