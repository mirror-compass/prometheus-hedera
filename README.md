<p align="center">
  <img src="https://img.shields.io/badge/Hedera-Testnet-blueviolet?style=for-the-badge" alt="Hedera Testnet" />
  <img src="https://img.shields.io/badge/Track-Sustainability-2E7D52?style=for-the-badge" alt="Sustainability Track" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Tests-39%20Passing-4CAF7D?style=for-the-badge" alt="39 Tests Passing" />
</p>

<h1 align="center">🔥 Project Prometheus</h1>

<h3 align="center">The Trust Layer for Decentralized Survival Intelligence</h3>

<p align="center">
  <em>Verifiable Knowledge Integrity · Transparent Impact Distribution · Community Governance</em>
</p>

<p align="center">
  <strong>Hedera Hello Future Apex Hackathon 2026 — Sustainability Track</strong>
</p>

---

## What Is Prometheus?

Project Prometheus is a Hedera-based trust layer for a decentralized, offline-first AI field brain — a Raspberry Pi device loaded with cross-domain survival knowledge (medicine, botany, agriculture, engineering, security) that operates without internet.

Hedera provides what no centralized system can:

- **Immutable verification** that knowledge bases are unaltered
- **Transparent tracking** of humanitarian fund flows from commercial sales to community deployments
- **Decentralized governance** for knowledge curation decisions

The result is a **buy-one-fund-one ecosystem** where every device purchase verifiably funds deployment to underserved communities — creating accountable, carbon-efficient humanitarian impact anchored to the most sustainable public ledger available.

> *"Steal fire from the gods. Give it to everyone. Make it unstealable."*

---

## The Problem

**Knowledge is locked behind walls.** Actionable survival, medical, and agricultural knowledge is gated by paywalls, credentials, and internet dependency. When connectivity fails — through disaster, conflict, or collapse — communities lose access to the knowledge they need most. No system currently provides cross-domain AI reasoning that operates offline on commodity hardware.

**Trust is in the dark.** Even when offline AI devices exist, distributing them creates trust challenges that current infrastructure cannot solve:

| Challenge | Question |
|-----------|----------|
| Content integrity | How does a community verify their device has the validated, peer-reviewed knowledge — not a corrupted copy? |
| Fund transparency | When a buyer's purchase funds a device for an underserved community, how do they verify the funds reached their destination? |
| Governance legitimacy | When knowledge bases are updated, who decides what gets included — and how is that process accountable? |

---

## The Solution: Three Hedera Services, One Trust Layer

### 🛡️ Knowledge Base Integrity — Hedera Consensus Service (HCS)

Every curated knowledge base is hashed and its fingerprint published to HCS at curation time. Devices verify their local content against the immutable HCS record via Mirror Node query, returning a trust score indicating whether content is unmodified, outdated, or potentially tampered with.

### 💛 Impact Distribution Tracking — Hedera Token Service (HTS)

A custom **Prometheus Impact Token (PIT)** tracks the humanitarian flow from commercial purchase to community deployment. Commercial sales allocate a percentage to the deployment fund (on-chain), fund balances are publicly visible, deployments are recorded with recipient org and region, and partner organizations confirm receipt on-chain — closing the loop.

### ✅ Knowledge Governance — HCS + HTS

Domain experts submit knowledge base proposals to HCS. Governance token holders (earned through contributions, not purchased) vote on proposals. Indigenous and traditional knowledge entries require verified community consent before inclusion, with consent records anchored to HCS.

---

## Live on Hedera Testnet

All contracts are deployed and verifiable on HashScan:

| Component | Contract ID | HashScan |
|-----------|-------------|----------|
| **PrometheusImpact** | `0.0.8170470` | [View on HashScan](https://hashscan.io/testnet/contract/0.0.8170470) |
| **KnowledgeRegistry** | `0.0.8170475` | [View on HashScan](https://hashscan.io/testnet/contract/0.0.8170475) |
| **DeviceRegistry** | `0.0.8170480` | [View on HashScan](https://hashscan.io/testnet/contract/0.0.8170480) |
| **HCS Topic** | `0.0.8170468` | [View on HashScan](https://hashscan.io/testnet/topic/0.0.8170468) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE DEVICE                              │
│  Raspberry Pi 5 + AI HAT+ 2 · Ollama · Local LLM · RAG        │
│  Solar + Battery · Offline-First · WiFi Hotspot Interface       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Local hash verification of knowledge bases against HCS   │   │
│  │ Device ID registered on-chain at assembly                │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  HEDERA CONSENSUS│ │  HEDERA TOKEN    │ │  SMART CONTRACT  │
│  SERVICE (HCS)   │ │  SERVICE (HTS)   │ │  SERVICE         │
│                  │ │                  │ │                  │
│ • KB hash        │ │ • Impact tokens  │ │ • Fund allocation│
│   anchoring      │ │ • Governance     │ │   (80/20 split)  │
│ • Governance     │ │   tokens         │ │ • Escrow release │
│   votes          │ │ • Device NFTs    │ │ • Partner confirm│
│ • Consent records│ │                  │ │                  │
│ • Audit trails   │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
              ┌──────────────────────────┐
              │      MIRROR NODE         │
              │                          │
              │  Public transparency     │
              │  dashboard — anyone can  │
              │  verify fund flows,      │
              │  device registry, and    │
              │  knowledge versions      │
              └──────────────────────────┘
```

---

## Smart Contracts

### PrometheusImpact.sol

The core contract automating the buy-one-fund-one mechanism:

- **On purchase:** Receives payment, splits into operational revenue (80%) and deployment fund (20%). Split ratio is governance-adjustable.
- **On deployment threshold:** When the fund can cover a device's BOM + shipping, emits a deployment-ready event.
- **On partner confirmation:** Partner submits on-chain confirmation of device receipt. Triggers impact token minting to the original buyer.

### KnowledgeRegistry.sol

Manages the on-chain registry of knowledge base versions:

- Registers knowledge base hashes anchored to HCS topic IDs
- Tracks version history with immutable audit trail
- Enables any device to verify its local content against the canonical hash

### DeviceRegistry.sol

Tracks every Prometheus device from assembly to deployment:

- Registers device IDs with hardware configuration and knowledge base version
- Records deployment destination, partner organization, and region
- Logs partner confirmation of receipt and activation

---

## Test Suite

39 tests passing across all three contracts:

```bash
npx hardhat test
```

Tests cover:
- Fund allocation splits and configurable ratios
- Deployment fund accumulation and threshold events
- Partner confirmation and impact token minting
- Knowledge base hash registration and version tracking
- Device registration, deployment, and confirmation flows
- Access control and governance permissions
- Edge cases and error conditions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24 |
| Development Framework | Hardhat |
| Hedera SDK | @hashgraph/sdk |
| Testing | Hardhat + Ethers.js |
| Frontend | React |
| Edge Device | Raspberry Pi 5 (8GB) + AI HAT+ 2 |
| AI Inference | Ollama + Llama 3.1 8B / Qwen3-8B |
| Knowledge Retrieval | RAG pipeline (LlamaIndex) |
| Network | Hedera Testnet |

---

## Project Structure

```
prometheus/
├── contracts/
│   ├── PrometheusImpact.sol      # Fund allocation & impact tracking
│   ├── KnowledgeRegistry.sol     # Knowledge base hash registry
│   └── DeviceRegistry.sol        # Device lifecycle tracking
├── test/
│   ├── PrometheusImpact.test.js
│   ├── KnowledgeRegistry.test.js
│   └── DeviceRegistry.test.js
├── scripts/
│   ├── deploy.js                 # Hedera testnet deployment
│   └── simulate.js               # End-to-end simulation
├── frontend/                     # Transparency dashboard
├── docs/
│   ├── white-paper.md
│   └── hackathon-proposal.md
├── hardhat.config.js
├── package.json
└── .env                          # Contract IDs (see .env.example)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))

### Installation

```bash
git clone https://github.com/mirror-compass/prometheus-hedera.git
cd prometheus-hedera
npm install
```

### Configuration

Copy the environment template and add your Hedera testnet credentials:

```bash
cp .env.example .env
```

```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Testnet

```bash
node scripts/deploy.js
```

---

## Why Hedera?

| Requirement | Why Hedera Wins |
|-------------|----------------|
| **Cost** | HCS messages cost ~$0.0001. Humanitarian budgets can't afford gas wars. |
| **Carbon coherence** | A project built on seven-generation stewardship principles needs a carbon-negative network. |
| **Speed** | Sub-second finality. Knowledge verification and fund confirmations happen in real time. |
| **Enterprise credibility** | Humanitarian orgs and NGOs require enterprise-grade reliability. |
| **Native tokens** | HTS provides token issuance without smart contract overhead. |
| **Free reads** | Mirror Node enables public accountability without on-chain query costs. |

---

## Sustainability Track Alignment

**Ecological:** Every Prometheus transaction runs on the most energy-efficient public DLT. Devices are solar-rechargeable with 10+ year hardware lifespan. Knowledge deployed once compounds indefinitely.

**Social:** Buy-one-fund-one ensures commercial success translates to expanded access. Open-source licensing prevents capture. Cultural sovereignty protections for indigenous knowledge contributors. Governance tokens are earned, not purchased.

**Economic:** Self-funding via device sales — no perpetual donor dependency. On-chain fund flows make the entire model auditable by anyone.

---

## Roadmap

| Phase | Timeline | Milestones |
|-------|----------|-----------|
| **Hackathon MVP** | Now | Smart contracts deployed, HCS anchoring, impact tokens, transparency dashboard, proof-of-concept device |
| **Post-Hackathon** | Q2–Q3 2026 | Governance token framework, 2–3 humanitarian org partnerships, 3 regional knowledge packs, nonprofit formation |
| **Scale** | Q4 2026–2027 | Commercial sales with on-chain tracking, first funded deployments, cultural sovereignty consent framework, LoRa mesh networking |

---

## Business Model

- **Ready-made devices:** $500–$700
- **Impact mechanism:** 20% of each sale funds a device for an underserved community, tracked on-chain
- **Competitive moat:** Open-source + on-chain trust. Can't be undercut on price (BOM is public). Can't be outcompeted on trust (fund flows are on-chain). The moat is community, not IP.

---

## Hardware Bill of Materials

| Component | Specification | Est. Cost |
|-----------|--------------|-----------|
| Raspberry Pi 5 | 8GB RAM | $80 |
| NVMe SSD | 1TB, M.2 | $60–$80 |
| M.2 HAT | Official Pi M.2 HAT+ | $12 |
| AI HAT+ 2 (optional) | Hailo-10H, 8GB | $130 |
| Battery Pack | PiSugar 3 Plus, 5000mAh | $40–$50 |
| Solar Panel | 20W portable, foldable | $25–$40 |
| Enclosure + Cooling | Ruggedized case, active fan | $15–$25 |
| Faraday Pouch | Signal/EMP blocking | $10–$20 |

**Base config: ~$200 | Full config with AI acceleration: ~$410**

---

## License

- **Software:** GPL-3.0 — all modifications remain open-source
- **Hardware Designs:** CERN-OHL-S — schematics remain freely available
- **Knowledge Bases:** CC BY-SA 4.0 — knowledge stays in the commons
- **Traditional/Indigenous Knowledge:** Subject to contributing community sovereignty and consent

---

## Team

The founding team brings clinical medicine, systems architecture, and decentralized technology together:

- **Clinical credibility** — Practicing psychiatrist with military medic background. Direct experience with austere-environment medicine.
- **Technical fluency** — Currently building Mirror Compass, a digital therapeutic app using AI companions and federated architecture.
- **Ecosystem alignment** — Deep understanding of Hedera's utility infrastructure as humanitarian tooling.
- **Ethical framework** — Seven-generation stewardship philosophy. Open-source is a design principle, not a marketing strategy.

---

<p align="center">
  <strong>The fire is free. The trust is on-chain. Pass it on.</strong>
</p>

<p align="center">
  <em>Project Prometheus — Hedera Hello Future Apex Hackathon 2026 — Sustainability Track</em>
</p>
