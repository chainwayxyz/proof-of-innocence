# Proof of Innocence

Proof of Innocence is built on Tornado Cash which is a non-custodial Ethereum and ERC20 privacy solution based on zkSNARKs.

On Tornado Cash, to make a deposit user generates a secret and sends its hash (called a commitment) along with the deposit amount to the Tornado smart contract. The contract accepts the deposit and adds the commitment to its list of deposits.

So there can be bad actors in these deposits, so if a bad actor (example associated with a hack etc) is known, its commitment is also known.

Later, when the user does a withdrawal, the user's commitment is not known with zkSnark technology. But this leds to a problem since innocent users are under suspicion.

Proof of Innocence lets the users sends proofs that the withdrawal is not associated with some blacklisted commitments. With using the note given on deposit, all users can prove that the deposit is not from a list of commitments.
