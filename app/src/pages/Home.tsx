const Home = () => {
  return (
    <div className="text-left ">
    <p>Tornado Cash is a popular protocol on Ethereum that allows users to make private transactions by breaking the on-chain link between the recipient and destination addresses. However, there may be instances where a user wants to demonstrate that their use of Tornado Cash is above board and not related to any illicit activity. That’s where Proof of Innocence comes in. Proof of Innocence is a tool that allows users to prove that their withdrawals from Tornado Cash are not from a list of specified deposits, selected by the user themselves. This allows users to clear their name and demonstrate their innocence without revealing their identity.</p>
    <p>You can read more about it in <a href="https://medium.com/@chainway_xyz/introducing-proof-of-innocence-built-on-tornado-cash-7336d185cda6" target="_blank">this Medium article</a></p>
    <a className="inline-block font-bold px-4 py-2 border rounded my-8" href="/prove">Open Demo</a>
    </div>
  );
};

export default Home;
