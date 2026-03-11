import { useState } from "react";
import { useTopicMessages } from "../hooks/useHederaMirror";
import { KNOWLEDGE_TOPIC_ID, KNOWLEDGE_REGISTRY_ID, HASHSCAN_URL } from "../utils/constants";

export default function KnowledgeVerifier() {
  const [hashInput, setHashInput] = useState("");
  const [result, setResult] = useState(null);
  const { data: topicData, loading } = useTopicMessages(KNOWLEDGE_TOPIC_ID);

  // Parse HCS messages — each message is a base64-encoded JSON
  const messages = (topicData?.messages || []).map((msg) => {
    try {
      const decoded = atob(msg.message);
      return { ...JSON.parse(decoded), sequence: msg.sequence_number, consensusTimestamp: msg.consensus_timestamp };
    } catch {
      return null;
    }
  }).filter(Boolean);

  const handleVerify = () => {
    const normalizedInput = hashInput.startsWith("0x") ? hashInput : `0x${hashInput}`;
    const match = messages.find((m) => m.hash === normalizedInput);
    setResult(match || "not_found");
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Knowledge Verifier</h2>
        <a
          href={`${HASHSCAN_URL}/topic/${KNOWLEDGE_TOPIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-orange-400 hover:text-orange-300"
        >
          HCS Topic
        </a>
      </div>

      {/* Verification input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter knowledge base hash (0x...)"
          value={hashInput}
          onChange={(e) => { setHashInput(e.target.value); setResult(null); }}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={handleVerify}
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Verify
        </button>
      </div>

      {/* Verification result */}
      {result && result !== "not_found" && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-green-400 font-medium mb-1">Verified on HCS</p>
          <p className="text-gray-300">Domain: <span className="text-white">{result.domain}</span></p>
          <p className="text-gray-300">Version: <span className="text-white">{result.version}</span></p>
          <p className="text-gray-300">Anchored: <span className="text-white">{result.timestamp}</span></p>
        </div>
      )}
      {result === "not_found" && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-red-400">Hash not found in the knowledge audit trail.</p>
        </div>
      )}

      {/* Anchored knowledge bases from HCS */}
      <h3 className="text-sm font-medium text-gray-400 mb-2">Anchored Knowledge Bases (HCS)</h3>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading HCS messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-500 text-sm">No knowledge bases anchored yet.</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 font-medium">{msg.domain}</span>
                <span className="text-gray-500 text-xs">v{msg.version}</span>
              </div>
              <p className="text-gray-400 font-mono text-xs truncate">{msg.hash}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
