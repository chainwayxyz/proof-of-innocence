const Home = () => {
  return (
    <div>
    <p className="text-xl mb-4">Prove you are not hacker if you used Tornado Cash</p>
    <h2 className="text-2xl font-bold mb-4">How it works</h2>
    <ol className="list-decimal pl-8 mb-4">
      <li>Every Tornado Cash deposits include commitment</li>
      <li>When you withdraw your crypto you don't want to reveal your commitment</li>
      <li>With Proof of Innocence you can prove that your commitment is not from given list</li>
      <li>Use it at your own risk</li>
    </ol>
    <a className="inline-block font-bold px-4 py-2 rounded bg-neutral-900 text-white" href="/prove">Open Demo</a>
    </div>
  );
};

export default Home;
