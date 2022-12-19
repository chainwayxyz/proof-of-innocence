const Home = () => {
  return (
    <div className="text-left ">
    <p>Introducing "Proof of Innocence," a new protocol that allows you to prove that your withdrawals on Tornado Cash are not from bad actors, while still maintaining your anonymity. This innovative tool is built on top of Tornado Cash and provides an additional layer of security and trust to the system.</p>
    <p className="text-xl font-bold underline mt-4">Background</p>
    <p>Tornado Cash is a popular privacy-preserving service for Ethereum that allows users to make anonymous transactions. In August, the Office of Foreign Assets Control (OFAC) imposed sanctions on wallet and smart contract addresses associated with Tornado Cash, citing concerns that the service was being used to launder billions of dollars. This raised concerns about the security and trustworthiness of the system, and highlighted the need for additional measures to prevent bad actors from using it for illegal purposes.</p>
    <p>That is where the "Proof of Innocence" protocol comes in. This innovative tool builds upon the existing capabilities of Tornado Cash and allows users to prove that their deposits are not from sanctioned or blacklisted addresses. By providing this proof, users can show that they are not hackers or other bad actors, and can make withdrawals from Tornado Cash with confidence. This not only improves the security and trustworthiness of the system, but also helps to protect legitimate users from being associated with illegal activities.</p>
    <p className="text-xl font-bold underline mt-4">How the Protocol Works</p>
    <p>When making a withdrawal from Tornado Cash, users typically provide a zero-knowledge proof that their commitment is in the Tornado Cash merkle tree. This proof ensures that the user's funds are securely held in the system and can be withdrawn without revealing the user's identity.</p>
    <p>The "Proof of Innocence" protocol adds an additional layer to this process by allowing users to prove that their commitment is not in a blacklisted set of commitments. This helps to ensure that the user is not a hacker or other bad actor who has been sanctioned or flagged for illegal activities.</p>
    <p>To create this proof, the user provides the blacklisted commitments and constructs a sparse merkle tree of this blacklist. This allows the user to easily and efficiently prove that their commitment is not in the blacklist. This proof can then be verified by anyone who has access to the blacklist, providing an additional layer of security and trust to the system.</p>
    <p>The "Proof of Innocence" protocol is open source and available on Github at <a href="https://github.com/chainwayxyz/proof-of-innocence" target={"_blank"}>https://github.com/chainwayxyz/proof-of-innocence</a></p>

    <a className="inline-block font-bold px-4 py-2 border rounded my-8" href="/prove">Open Demo</a>
    </div>
  );
};

export default Home;
