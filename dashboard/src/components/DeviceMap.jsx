import { useContractLogs } from "../hooks/useHederaMirror";
import { DEVICE_REGISTRY_ID, HASHSCAN_URL } from "../utils/constants";

// Known regions from our simulation data — in production these come from contract events
const REGION_COORDS = {
  "Amazon Basin, Brazil": { lat: -3.4, lng: -65.0 },
  "Sub-Saharan Africa, Kenya": { lat: -1.3, lng: 36.8 },
  "Southeast Asia, Cambodia": { lat: 11.5, lng: 104.9 },
};

const DEVICES = [
  { id: 1, region: "Amazon Basin, Brazil", partner: "Medicos Sem Fronteiras", type: "Funded", status: "Active" },
  { id: 2, region: "Sub-Saharan Africa, Kenya", partner: "Kenya Red Cross", type: "Funded", status: "Active" },
  { id: 3, region: "Southeast Asia, Cambodia", partner: "Cambodia Rural Health Initiative", type: "Commercial", status: "Active" },
];

function RegionPin({ region, devices }) {
  const coords = REGION_COORDS[region];
  if (!coords) return null;

  // Map lat/lng to rough percentage positions on an ASCII-style world map
  const left = ((coords.lng + 180) / 360) * 100;
  const top = ((90 - coords.lat) / 180) * 100;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-orange-300 animate-pulse cursor-pointer" />
      <div className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg p-2 whitespace-nowrap z-20 text-xs">
        <p className="text-orange-400 font-medium">{region}</p>
        <p className="text-gray-400">{devices} device(s) active</p>
      </div>
    </div>
  );
}

export default function DeviceMap() {
  // Count devices per region
  const regionCounts = {};
  DEVICES.forEach((d) => {
    regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Global Deployment Map</h2>
        <a
          href={`${HASHSCAN_URL}/contract/${DEVICE_REGISTRY_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-orange-400 hover:text-orange-300"
        >
          View on HashScan
        </a>
      </div>

      {/* Simple map representation */}
      <div className="relative bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden" style={{ height: 280 }}>
        {/* World outline (simplified SVG) */}
        <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="500" cy="250" rx="480" ry="230" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-600" />
          <line x1="20" y1="250" x2="980" y2="250" stroke="currentColor" strokeWidth="0.5" className="text-gray-700" />
          <line x1="500" y1="20" x2="500" y2="480" stroke="currentColor" strokeWidth="0.5" className="text-gray-700" />
          {/* Rough continent outlines */}
          <text x="200" y="180" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">N. America</text>
          <text x="180" y="320" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">S. America</text>
          <text x="470" y="200" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">Europe</text>
          <text x="480" y="300" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">Africa</text>
          <text x="680" y="230" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">Asia</text>
          <text x="750" y="380" className="text-gray-700 text-xs" fill="currentColor" fontSize="14">Oceania</text>
        </svg>
        {/* Device pins */}
        {Object.entries(regionCounts).map(([region, count]) => (
          <RegionPin key={region} region={region} devices={count} />
        ))}
      </div>

      {/* Device table */}
      <div className="mt-4 space-y-2">
        {DEVICES.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-sm">
            <div>
              <span className="text-white font-medium">Device #{d.id}</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-gray-400">{d.region}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">{d.partner}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                d.status === "Active"
                  ? "bg-green-900/50 text-green-400"
                  : "bg-yellow-900/50 text-yellow-400"
              }`}>
                {d.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
