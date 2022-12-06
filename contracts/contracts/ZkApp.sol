//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;

// Please note that you should adjust the length of the inputs
interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool r);
}

contract ProofOfInnocence {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    address public immutable verifier;

    constructor(address verifier_) {
        verifier = verifier_;
    }

    /**
     * Please adjust the IVerifier.sol and the array length of publicSignals
     */
    function verify(uint256[3] memory publicSignals, Proof memory proof)
        public
        view
        returns (bool)
    {
        bool result = IVerifier(verifier).verifyProof(
            proof.a,
            proof.b,
            proof.c,
            publicSignals
        );
        return result;
    }
}
