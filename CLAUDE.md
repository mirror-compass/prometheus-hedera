# CLAUDE.md — Project Prometheus: Hedera Trust Layer

## Project Overview

Project Prometheus is a decentralized, offline-first AI survival intelligence system built on Raspberry Pi hardware. This repository contains the **Hedera trust layer** — the on-chain infrastructure that provides verifiable knowledge integrity, transparent humanitarian fund tracking, and decentralized governance for the Prometheus ecosystem.

This is being built for the **Hedera Hello Future Apex Hackathon 2026** (Sustainability Track).
- **Deadline:** March 23, 2026 11:59 PM ET
- **Track:** Sustainability
- **Prize Pool:** $250,000 ($40K for Sustainability track)

## Architecture

### Three Smart Contracts + One Frontend

```
prometheus-hedera/
├── contracts/
│   ├── PrometheusImpact.sol    # Fund allocation & impact tracking
│   ├── KnowledgeRegistry.sol   # Knowledge base hash anchoring & verification
│   └── DeviceRegistry.sol      # Device NFT minting & deployment tracking
├── scripts/
│   ├── deploy.js               # Deploy all contracts to Hedera testnet
│   ├── simulate-purchase.js    # Simulate a device purchase flow
│   ├── anchor-knowledge.js     # Anchor a knowledge base hash
│   └── register-device.js      # Register and deploy a device
├── test/
│   ├── PrometheusImpact.test.js
│   ├── KnowledgeRegistry.test.js
│   └── DeviceRegistry.test.js
├── dashboard/                  # React frontend (Vite + React + Tailwind)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── FundTracker.jsx       # Real-time fund balance & allocation
│   │   │   ├── DeviceMap.jsx         # Global deployment map
│   │   │   ├── KnowledgeVerifier.jsx # Hash verification UI
│   │   │   ├── ImpactFeed.jsx        # Live transaction feed
│   │   │   └── Header.jsx
│   │   ├── hooks/
│   │   │   ├── useHederaMirror.js    # Mirror Node API hooks
│   │   │   └── useContract.js        # Contract interaction hooks
│   │   └── utils/
│   │       ├── hedera.js             # Hedera SDK config
│   │       └── constants.js          # Contract addresses, ABIs
│   └── package.json
├── hardhat.config.js           # Hardhat config for Hedera testnet
├── package.json
├── .env.example                # Template for Hedera credentials
├── CLAUDE.md                   # This file
└── README.md
```

### Hedera Services Used

1. **Smart Contract Service** — EVM-compatible Solidity contracts deployed via Hardhat
2. **Hedera Token Service (HTS)** — Impact tokens (fungible) + Device NFTs (non-fungible) via HTS precompile
3. **Hedera Consensus Service (HCS)** — Knowledge base hash anchoring (ordered, immutable message log)
4. **Mirror Node REST API** — Read-only queries for the transparency dashboard (free, no HBAR cost)

### Contract Details

#### PrometheusImpact.sol
- Receives HBAR payments for device purchases
- Splits payment: 80% operational, 20% deployment fund (ratio is owner-adjustable)
- Tracks deployment fund balance on-chain
- Emits `PurchaseRecorded(buyer, amount, deploymentFundContribution)` event
- Emits `DeploymentFundReady(fundBalance, deviceCost)` when threshold met
- Owner can trigger fund release to deployment partner with on-chain record
- Mints a Prometheus Impact Token (PIT) to the buyer as proof of contribution

#### KnowledgeRegistry.sol
- Stores knowledge base hashes with metadata (version, domain, curator, timestamp)
- `anchorKnowledgeBase(bytes32 hash, string domain, string version)` — owner-only
- `verifyKnowledgeBase(bytes32 hash)` — public, returns bool + metadata
- `getLatestVersion(string domain)` — returns current hash for a domain
- Also submits hash to an HCS topic for immutable audit trail
- Emits `KnowledgeBaseAnchored(hash, domain, version, timestamp)` event

#### DeviceRegistry.sol
- Mints an NFT for each assembled Prometheus device
- Metadata: device ID, knowledge base version hash, destination region, assembly date
- `registerDevice(...)` — mints NFT, records device
- `confirmDeployment(uint deviceId, string partnerOrg)` — partner confirms receipt
- `getDeviceStatus(uint deviceId)` — returns full device lifecycle status
- Emits `DeviceRegistered(deviceId, region, knowledgeHash)` event
- Emits `DeviceDeployed(deviceId, partnerOrg, timestamp)` event

### Dashboard (React)

The transparency dashboard is the public-facing proof that the system works. It reads from Mirror Node (free) and displays:

1. **Fund Tracker** — Total collected, total deployed, current balance, allocation ratio
2. **Device Map** — World map showing registered and deployed devices by region
3. **Knowledge Verifier** — Input a hash, verify against on-chain registry
4. **Impact Feed** — Live scrolling feed of purchases, deployments, and verifications
5. **Stats Banner** — Total devices, total communities served, total funds distributed

### Tech Stack

- **Smart Contracts:** Solidity ^0.8.20, Hardhat, @hashgraph/sdk
- **HTS Integration:** HTS precompile (0x167) for native token operations from Solidity
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Hedera Interaction:** @hashgraph/sdk for contract deployment, ethers.js for frontend
- **Mirror Node:** REST API at https://testnet.mirrornode.hedera.com/api/v1/
- **Deployment:** Vercel (frontend), Hedera Testnet (contracts)

## Development Setup

### Prerequisites
- Node.js 18+
- A Hedera Testnet account (get one at https://portal.hedera.com/)
- Testnet HBAR (faucet gives 10,000 HBAR/day)

### Environment Variables (.env)
```
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
```

### Build Sequence (follow this order)

1. `npm install` — root and dashboard
2. `npx hardhat compile` — compile contracts
3. `npx hardhat test` — run tests
4. `node scripts/deploy.js` — deploy to testnet, outputs contract addresses
5. Update `dashboard/src/utils/constants.js` with deployed addresses
6. `cd dashboard && npm run dev` — start dashboard locally
7. `node scripts/simulate-purchase.js` — run a simulated purchase to populate dashboard

## Key Technical Notes

### Hedera-Specific Gotchas
- Hedera uses **account IDs** (0.0.xxxxx) not just addresses. The SDK handles conversion.
- Gas fees on Hedera are **USD-denominated and converted to HBAR** at transaction time. Much cheaper and more predictable than Ethereum.
- HTS tokens created via precompile need **auto-association slots** on receiving accounts.
- Mirror Node data has a **3-5 second delay** from consensus. Dashboard should account for this.
- Testnet resets periodically. Keep deployment scripts idempotent.
- Use `@hashgraph/sdk` v2.x for deployment scripts, `ethers.js` v6 for frontend contract interaction via JSON-RPC relay.

### Hedera Testnet JSON-RPC Relay
- URL: `https://testnet.hashio.io/api`
- Chain ID: 296
- This allows standard ethers.js interaction with deployed contracts

### HCS Topic for Knowledge Audit Trail
- Create a dedicated HCS topic during deployment
- Submit knowledge base hashes as HCS messages (ordered, timestamped, immutable)
- Mirror Node API: `GET /api/v1/topics/{topicId}/messages` to read back

### Mirror Node Endpoints (for dashboard)
- Transactions: `GET /api/v1/transactions?account.id={contractId}`
- Token info: `GET /api/v1/tokens/{tokenId}`
- Token balances: `GET /api/v1/tokens/{tokenId}/balances`
- Contract logs: `GET /api/v1/contracts/{contractId}/results/logs`
- HCS messages: `GET /api/v1/topics/{topicId}/messages`

## Judging Criteria Alignment

Build with these weights in mind:

| Criteria | Weight | How We Score |
|----------|--------|-------------|
| Innovation | 10% | First cross-domain survival AI trust layer on any DLT |
| Feasibility | 10% | All components use existing Hedera services; BOM and business model documented |
| Execution | 20% | Working MVP on testnet with full demo flow; clear roadmap beyond hackathon |
| Integration | 15% | Uses HCS + HTS + Smart Contracts + Mirror Node — deep, multi-service integration |
| Success | 20% | Creates new Hedera accounts (buyers, partners, devices); drives TPS through purchases and verifications |
| Validation | 15% | White paper developed through iterative domain expert review; target partnerships identified |
| Pitch | 10% | Clear problem/solution narrative; compelling humanitarian angle with verifiable impact |

## MVP Scope (What to Build vs. What to Describe)

### BUILD (must be working on testnet):
- [ ] PrometheusImpact.sol — fund split and impact token minting
- [ ] KnowledgeRegistry.sol — hash anchoring and verification
- [ ] DeviceRegistry.sol — device NFT and deployment confirmation
- [ ] Deploy scripts for all three contracts
- [ ] Simulation scripts that demonstrate the full flow
- [ ] React dashboard reading from Mirror Node
- [ ] Dashboard deployed to Vercel with live testnet data

### DESCRIBE (in pitch deck and README, don't build):
- Governance token voting mechanism
- Mesh networking between devices
- Full regional knowledge pack system
- Indigenous consent framework details
- Partner org onboarding portal

## Important Links
- Hedera Docs: https://docs.hedera.com/
- Hedera SDK JS: https://github.com/hashgraph/hedera-sdk-js
- HTS Precompile Examples: https://github.com/hashgraph/hedera-smart-contracts
- Mirror Node API: https://testnet.mirrornode.hedera.com/api/v1/docs
- Hardhat Hedera Plugin: https://github.com/hashgraph/hedera-hardhat-forking
- Hedera JSON-RPC Relay: https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay
- Testnet Portal: https://portal.hedera.com/
- HashScan Explorer: https://hashscan.io/testnet/

## Context
This project emerged from a theoretical exercise in integrative bio-engineering (the "Byzantine Fire" protocol) that demonstrated how cross-domain AI reasoning can synthesize actionable protocols from distributed knowledge. The insight — that the bottleneck to survival knowledge isn't information but synthesis and access — led to the Prometheus vision: a community-owned, offline-first AI field brain on a Raspberry Pi. Hedera provides the trust layer that makes the humanitarian distribution model verifiable, transparent, and accountable. The full white paper is available in the `/docs` directory.
