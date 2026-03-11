import Header from "./components/Header";
import FundTracker from "./components/FundTracker";
import DeviceMap from "./components/DeviceMap";
import KnowledgeVerifier from "./components/KnowledgeVerifier";
import ImpactFeed from "./components/ImpactFeed";
import {
  PROMETHEUS_IMPACT_ID,
  KNOWLEDGE_REGISTRY_ID,
  DEVICE_REGISTRY_ID,
  KNOWLEDGE_TOPIC_ID,
} from "./utils/constants";

function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {[
        { label: "Devices Deployed", value: "3" },
        { label: "Communities Served", value: "3" },
        { label: "Knowledge Domains", value: "3" },
        { label: "Regions Reached", value: "3" },
        { label: "Contracts Live", value: "3" },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-xl p-4 text-center"
        >
          <p className="text-2xl font-bold text-orange-400">{s.value}</p>
          <p className="text-xs text-gray-400 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ContractLinks() {
  const contracts = [
    { name: "PrometheusImpact", id: PROMETHEUS_IMPACT_ID },
    { name: "KnowledgeRegistry", id: KNOWLEDGE_REGISTRY_ID },
    { name: "DeviceRegistry", id: DEVICE_REGISTRY_ID },
    { name: "HCS Topic", id: KNOWLEDGE_TOPIC_ID },
  ];

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {contracts.map((c) => (
        <a
          key={c.id}
          href={`https://hashscan.io/testnet/${c.name === "HCS Topic" ? "topic" : "contract"}/${c.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:border-orange-500/50 hover:text-orange-300 transition"
        >
          <span className="font-medium">{c.name}</span>
          <span className="text-gray-500">{c.id}</span>
        </a>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <StatsBar />
        <ContractLinks />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <FundTracker />
            <KnowledgeVerifier />
          </div>
          <div className="space-y-8">
            <DeviceMap />
            <ImpactFeed />
          </div>
        </div>
      </main>
      <footer className="border-t border-gray-800 py-6 mt-12 text-center text-xs text-gray-500">
        Project Prometheus — Hedera Hello Future Apex Hackathon 2026 (Sustainability Track)
      </footer>
    </div>
  );
}
