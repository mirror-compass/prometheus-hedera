export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl font-bold">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Project Prometheus</h1>
            <p className="text-xs text-gray-400">Hedera Transparency Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-400">Testnet</span>
          </span>
          <a
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 transition"
          >
            HashScan
          </a>
        </div>
      </div>
    </header>
  );
}
