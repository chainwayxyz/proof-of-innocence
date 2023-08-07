export default function Loading({
  progress,
  loadingMsg,
}: {
  progress: any;
  loadingMsg: string;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center m-0">
      <div
        className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"
        style={{
          borderTopColor: "#3498db",
          WebkitAnimation: "spinner 1.5s linear infinite",
          animation: "spinner 1.5s linear infinite",
        }}
      ></div>
      <h2 className="text-center text-white text-xl font-semibold">
        Loading... {progress != 0 && Math.floor(progress) + "%"}
      </h2>
      <p className="w-1/3 text-center text-white">{loadingMsg}</p>
    </div>
  );
}
