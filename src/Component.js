/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Zu7gzjAUMdq
 */

export default function Component() {
  return (
    <div className="bg-[#0f0f0f] text-white h-screen p-4 flex flex-col items-center justify-center space-y-8">
      <h1 className="text-4xl font-bold">Brick Movers</h1>
      <div className="h-[2px] w-full bg-[#3498db]" />
      <button className="rounded-full bg-gradient-to-r from-purple-400 to-blue-500 px-8 py-4 text-white font-bold shadow-lg focus:outline-none">
        Record
      </button>
      <div className="flex space-x-4">
        <button className="bg-green-600 hover:bg-green-700 focus:ring focus:ring-green-300" variant="default">
          Connect LEGO Spike Prime Hub
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 focus:ring focus:ring-blue-300" variant="default">
          Start Play
        </button>
        <button className="bg-red-600 hover:bg-red-700 focus:ring focus:ring-red-300" variant="destructive">
          Stop Play
        </button>
      </div>
    </div>
  )
}

