# Proof of Innocence built on Tornado Cash

Tornado Cash is a popular protocol on Ethereum that allows users to make private transactions by breaking the on-chain link between the recipient and destination addresses. However, there may be instances where a user wants to demonstrate that their use of Tornado Cash is above board and not related to any illicit activity. That’s where Proof of Innocence comes in. Proof of Innocence is a tool that allows users to prove that their withdrawals from Tornado Cash are not from a list of specified deposits, selected by the user themselves. This allows users to clear their name and demonstrate their innocence without revealing their identity. Check out the demo application at poi.chainway.xyz to see Proof of Innocence in action.

You can read more about it in [this Medium article](https://medium.com/@chainway_xyz/introducing-proof-of-innocence-built-on-tornado-cash-7336d185cda6)

## Usage

You can use it from https://poi.chainway.xyz/

## Building from scracth

- Install [Node.js](https://nodejs.org) version 16
  - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn](https://yarnpkg.com/en/docs/install)
- Install [Rust and Circom](https://docs.circom.io/getting-started/installation/#installing-circom)
- Install dependencies: `yarn`
- Download the ptau file to the circuits folder from the [here](https://drive.google.com/file/d/1QQ2dy1N1CI850h7omogRBE5okR99zhVn/view?usp=share_link)
- Build the project by running `yarn build:all`

## Last Words

Please note that the use of Proof of Innocence is at your own risk. Chainway values the importance of open source projects and welcomes any feedback on Proof of Innocence. We encourage users to thoroughly evaluate the tool before using it and to handle their private keys and Tornado Cash notes with care.
