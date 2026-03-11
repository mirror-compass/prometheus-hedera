import { useAccountTransactions } from "../hooks/useHederaMirror";
import {
  PROMETHEUS_IMPACT_ID,
  KNOWLEDGE_REGISTRY_ID,
  DEVICE_REGISTRY_ID,
  HASHSCAN_URL,
} from "../utils/constants";

function classifyTransaction(tx) {
  const entityId = tx.entity_id;
  if (entityId === PROMETHEUS_IMPACT_ID) return { type: "Purchase", color: "text-green-400", bg: "bg-green-900/30" };
  if (entityId === KNOWLEDGE_REGISTRY_ID) return { type: "Knowledge", color: "text-blue-400", bg: "bg-blue-900/30" };
  if (entityId === DEVICE_REGISTRY_ID) return { type: "Device", color: "text-purple-400", bg: "bg-purple-900/30" };
  return { type: "Other", color: "text-gray-400", bg: "bg-gray-800/30" };
}

function formatTimestamp(ts) {
  if (!ts) return "--";
  const seconds = parseFloat(ts);
  return new Date(seconds * 1000).toLocaleString();
}

function shortenTxId(txId) {
  if (!txId) return "--";
  const parts = txId.split("-");
  if (parts.length >= 2) return `${parts[0].slice(-8)}...`;
  return txId.slice(0, 16) + "...";
}

export default function ImpactFeed() {
  // Fetch transactions from all 3 contracts
  const { data: impactTxs, loading: l1 } = useAccountTransactions(PROMETHEUS_IMPACT_ID);
  const { data: knowledgeTxs, loading: l2 } = useAccountTransactions(KNOWLEDGE_REGISTRY_ID);
  const { data: deviceTxs, loading: l3 } = useAccountTransactions(DEVICE_REGISTRY_ID);

  const loading = l1 || l2 || l3;

  // Merge and sort all transactions
  const allTxs = [
    ...(impactTxs?.transactions || []).map((tx) => ({ ...tx, entity_id: PROMETHEUS_IMPACT_ID })),
    ...(knowledgeTxs?.transactions || []).map((tx) => ({ ...tx, entity_id: KNOWLEDGE_REGISTRY_ID })),
    ...(deviceTxs?.transactions || []).map((tx) => ({ ...tx, entity_id: DEVICE_REGISTRY_ID })),
  ]
    .sort((a, b) => parseFloat(b.consensus_timestamp) - parseFloat(a.consensus_timestamp))
    .slice(0, 20);

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Live Impact Feed</h2>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading transactions...</p>
      ) : allTxs.length === 0 ? (
        <p className="text-gray-500 text-sm">No transactions yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {allTxs.map((tx, i) => {
            const { type, color, bg } = classifyTransaction(tx);
            return (
              <div key={i} className={`${bg} border border-gray-700/50 rounded-lg p-3 text-sm flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className={`${color} font-medium text-xs px-2 py-0.5 rounded bg-gray-800/50`}>
                    {type}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatTimestamp(tx.consensus_timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${tx.result === "SUCCESS" ? "text-green-500" : "text-red-500"}`}>
                    {tx.result || "PENDING"}
                  </span>
                  <a
                    href={`${HASHSCAN_URL}/transaction/${tx.transaction_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs"
                  >
                    {shortenTxId(tx.transaction_id)}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
