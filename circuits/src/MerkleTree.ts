export declare type HashFunction<T> = {
  (left: T, right: T): string;
};
export declare type Element = string | number;

export declare type Witness = {
  pathElements: Element[];
  pathIndices: number[];
  root: Element;
};


export class MerkleTree {
  protected _hashFn: HashFunction<Element>
  protected zeroElement: Element
  private nodes: Record<number, Record<string, Element>> = {};
  private zeroes: Element[];
  private height: number;
  private leafCount: bigint;

  constructor(hashFn: HashFunction<Element>, zeroElement: Element, height: number = 256) {
    this._hashFn = hashFn;
    this.height = height;
    this.leafCount = BigInt(Math.pow(2, height - 1));
    this.zeroElement = zeroElement;
    this.zeroes = [zeroElement];
    for (let i = 1; i < height; i++) {
      this.zeroes.push(this._hashFn(this.zeroes[i - 1], this.zeroes[i - 1]));
    }
  }

  /**
   * Returns a node which lives at a given index and level.
   * @param level Level of the node.
   * @param index Index of the node.
   * @returns The data of the node.
   */
  getNode(level: number, index: bigint): Element {
    return this.nodes[level]?.[index.toString()] ?? this.zeroes[level];
  }

  /**
   * Returns the root of the [Merkle Tree](https://en.wikipedia.org/wiki/Merkle_tree).
   * @returns The root of the Merkle Tree.
   */
   getRoot(): Element {
    return this.getNode(this.height - 1, BigInt(0));
  }

  // TODO: this allows to set a node at an index larger than the size. OK?
  private setNode(level: number, index: bigint, value: Element) {
    (this.nodes[level] ??= {})[index.toString()] = value;
  }

  // TODO: if this is passed an index bigger than the max, it will set a couple of out-of-bounds nodes but not affect the real Merkle root. OK?
  /**
   * Sets the value of a leaf node at a given index to a given value.
   * @param index Position of the leaf node.
   * @param leaf New value.
   */
   setLeaf(index: bigint, leaf: Element) {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }
    this.setNode(0, index, leaf);
    let currIndex = index;
    for (let level = 1; level < this.height; level++) {
      currIndex /= BigInt(2);

      const left = this.getNode(level - 1, currIndex * BigInt(2));
      const right = this.getNode(level - 1, currIndex * BigInt(2) + BigInt(1));

      this.setNode(level, currIndex, this._hashFn(left, right));
    }
  }

  /**
   * Returns the witness (also known as [Merkle Proof or Merkle Witness](https://computersciencewiki.org/index.php/Merkle_proof)) for the leaf at the given index.
   * @param index Position of the leaf node.
   * @returns The witness that belongs to the leaf.
   */
  getWitness(index: bigint): Witness {
    const pathElements: Element[] = [];
    const pathIndices: number[] = [];
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }
    // const witness = [];
    for (let level = 0; level < this.height - 1; level++) {
      const isLeft = index % BigInt(2) === BigInt(0);
      const sibling = this.getNode(level, isLeft ? index + BigInt(1) : index - BigInt(1));
      // witness.push({ isLeft, sibling });
      pathElements.push(sibling);
      pathIndices.push(1 - Number(isLeft));
      index /= BigInt(2);
    }
    return {
      pathElements,
      pathIndices,
      root: this.getRoot(),
    };
  }
  
}