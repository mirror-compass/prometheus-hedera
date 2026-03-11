import { useContractLogs, useContractInfo } from "../hooks/useHederaMirror";
import { PROMETHEUS_IMPACT_ID, HASHSCAN_URL } from "../utils/constants";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function FundTracker() {
  const { data: contractInfo, loading } = useContractInfo(PROMETHEUS_IMPACT_ID);
  const { data: logsData } = useContractLogs(PROMETHEUS_IMPACT_ID);

  // Parse purchase events from logs
  const purchaseEvents = (logsData?.logs || []).filter(
    (log) =>
      log.topics?.[0] ===
      "0x" + "PurchaseRecorded".padEnd(64, "0").slice(0, 64) ||
      log.data?.length > 10
  );

  const balanceHbar = contractInfo?.balance
    ? (Number(contractInfo.balance.balance) / 1e8).toFixed(2)
    : "--";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Fund Tracker</h2>
        <a
          href={`${HASHSCAN_URL}/contract/${PROMETHEUS_IMPACT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-orange-400 hover:text-orange-300"
        >
          View on HashScan
        </a>
      </div>
      {loading ? (
        <div className="text-gray-500 text-sm">Loading contract data...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Contract Balance"
            value={`${balanceHbar} HBAR`}
            sub="Total held in contract"
          />
          <StatCard
            label="Split Ratio"
            value="20%"
            sub="To deployment fund"
          />
          <StatCard
            label="Contract ID"
            value={PROMETHEUS_IMPACT_ID}
            sub="PrometheusImpact"
          />
          <StatCard
            label="Transactions"
            value={purchaseEvents.length || "--"}
            sub="Recent events logged"
          />
        </div>
      )}
    </section>
  );
}
