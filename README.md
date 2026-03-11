# 🔥 Project Prometheus — The Decentralized Field Brain

> *"He stole fire from the gods and gave it to humanity — not to make them gods, but to make them free."*

## What is Prometheus?

Project Prometheus is an open-source, offline-first AI survival intelligence system built on commodity hardware (Raspberry Pi). It provides cross-domain reasoning across medicine, botany, agriculture, engineering, security, and navigation — all running locally with no internet required.

**This repository contains the Hedera trust layer** — the on-chain infrastructure that makes the humanitarian distribution model verifiable, transparent, and accountable.

### The Problem

Actionable survival knowledge is locked behind paywalls, credentials, and internet-dependent infrastructure. When connectivity fails — through disaster, conflict, or collapse — communities lose access to the knowledge they need most. Existing offline AI solutions are either static document libraries or single-domain models. No system provides cross-domain AI reasoning that operates offline on commodity hardware.

Even when such a device exists, distributing it through a humanitarian model creates trust gaps: How do you verify the medical knowledge isn't tampered with? How do you prove donated funds reached their destination? How do you govern what knowledge gets included?

### The Solution

Hedera provides the trust layer:

- **🔐 Knowledge Integrity** — Every curated knowledge base is hashed and anchored to Hedera Consensus Service (HCS). Any device can verify its content is unaltered.
- **💰 Transparent Impact** — A buy-one-fund-one model where 20% of each commercial sale funds a device for an underserved community. All fund flows tracked on-chain via Hedera Token Service (HTS).
- **🗳️ Decentralized Governance** — Knowledge curation decisions are governed transparently, with voting records anchored to HCS.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EDGE DEVICE                          │
│  Raspberry Pi 5 + AI HAT+ 2 + NVMe SSD + Solar         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Local LLM   │  │ RAG Pipeline │  │ Knowledge DBs │  │
│  │ (Ollama)    │──│              │──│ (Curated)     │  │
│  └─────────────┘  └──────────────┘  └───────┬───────┘  │
│                                             │           │
│                          Local hash verification        │
└─────────────────────────────┬───────────────────────────┘
                              │ (when connectivity available)
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   HEDERA TRUST LAYER                    │
│                                                         │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────┐ │
│  │ KnowledgeRegistry│  │PrometheusImpact│  │ Device  │ │
│  │ (HCS + Contract) │  │ (HTS + Contract│  │Registry │ │
│  │                  │  │  + Smart Split) │  │ (NFT)   │ │
│  └──────────────────┘  └────────────────┘  └─────────┘ │
│                              │                          │
│                       Mirror Node API                   │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│               TRANSPARENCY DASHBOARD                    │
│  React + Vite + Tailwind                                │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌────────┐ │
│  │Fund Tracker│ │Device Map│ │Knowledge   │ │Impact  │ │
│  │            │ │          │ │Verifier    │ │Feed    │ │
│  └────────────┘ └──────────┘ └────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Hedera Testnet account ([Get one here](https://portal.hedera.com/))

### Setup
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/prometheus-hedera.git
cd prometheus-hedera

# Install dependencies
npm install
cd dashboard && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your Hedera testnet credentials

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Hedera testnet
node scripts/deploy.js

# Start the dashboard
cd dashboard && npm run dev
```

### Simulate the Full Flow
```bash
# After deploying, simulate a device purchase
node scripts/simulate-purchase.js

# Anchor a knowledge base hash
node scripts/anchor-knowledge.js

# Register and deploy a device
node scripts/register-device.js
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contracts | Solidity ^0.8.20 |
| Development Framework | Hardhat |
| Hedera SDK | @hashgraph/sdk v2.x |
| Frontend | React 18 + Vite + Tailwind CSS |
| Contract Interaction | ethers.js v6 via Hedera JSON-RPC Relay |
| Data Queries | Hedera Mirror Node REST API |
| Deployment | Vercel (frontend), Hedera Testnet (contracts) |

## Hedera Services Integration

| Service | Purpose |
|---------|---------|
| **Consensus Service (HCS)** | Knowledge base hash anchoring, governance audit trail |
| **Token Service (HTS)** | Prometheus Impact Tokens, Device Registry NFTs |
| **Smart Contract Service** | Fund allocation logic, knowledge verification, device lifecycle |
| **Mirror Node** | Free read access for transparency dashboard |

## Sustainability Track Alignment

- **Carbon-negative network** — Every transaction runs on Hedera's energy-efficient hashgraph consensus
- **Buy-one-fund-one** — Commercial success directly funds humanitarian deployment
- **Knowledge as renewable resource** — Once deployed, a device compounds value indefinitely
- **Community ownership** — Open-source, no subscriptions, no corporate kill switch
- **Cultural sovereignty** — On-chain consent records protect indigenous knowledge contributors

## Roadmap

- [x] White paper and architecture design
- [x] Hackathon proposal and pitch deck
- [ ] Smart contracts deployed to Hedera testnet
- [ ] Transparency dashboard live on Vercel
- [ ] Demo video and submission
- [ ] Post-hackathon: Nonprofit formation, partner development, pilot deployments

## License

- **Software:** GPL-3.0
- **Hardware designs:** CERN-OHL-S
- **Knowledge bases:** CC BY-SA 4.0
- **Indigenous knowledge:** Subject to community sovereignty and consent

## The Philosophy

> The fire is free. The trust is on-chain. Pass it on.

---

*Built for the Hedera Hello Future Apex Hackathon 2026 — Sustainability Track*
