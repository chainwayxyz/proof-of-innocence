const Home = () => {
  return (
    <div className="container px-4 text-slate-950 text-center md:text-left">
      <p className="tracking-wider font-light">
        Tornado Cash is a popular protocol on Ethereum that allows users to make
        private transactions by breaking the on-chain link between the recipient
        and destination addresses. However, there may be instances where a user
        wants to demonstrate that their use of Tornado Cash is above board and
        not related to any illicit activity. That’s where Proof of Innocence
        comes in. Proof of Innocence is a tool that allows users to prove that
        their withdrawals from Tornado Cash are not from a list of specified
        deposits, selected by the user themselves. This allows users to clear
        their name and demonstrate their innocence without revealing their
        identity.
      </p>
      <p className="mt-4 font-bold">
        You can read more about it in{" "}
        <a
          href="https://medium.com/@chainway_xyz/introducing-proof-of-innocence-built-on-tornado-cash-7336d185cda6"
          target="_blank"
          className="underline"
        >
          this Medium article
        </a>
      </p>
      <a
        className="inline-block font-normal border rounded-full shadow-md mb-8 mt-6 px-4 py-2 hover:bg-[#3F7474] hover:text-white hover:shadow-[#3F7474] hover:border-[#3F7474] ease-in-out duration-300"
        href="/prove"
      >
        Open Demo
      </a>
    </div>
  );
};

export default Home;
