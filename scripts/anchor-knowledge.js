/**
 * anchor-knowledge.js — Anchor a knowledge base hash on-chain and to HCS
 *
 * Calls KnowledgeRegistry.anchorKnowledgeBase() and also submits the
 * hash to the HCS topic for an immutable audit trail.
 *
 * Usage: node scripts/anchor-knowledge.js
 */

require("dotenv").config();
const crypto = require("crypto");
const {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  TopicMessageSubmitTransaction,
  TopicId,
  ContractId,
  Hbar,
} = require("@hashgraph/sdk");

// Sample knowledge bases to anchor
const KNOWLEDGE_BASES = [
  {
    content: "Prometheus Field Medicine Knowledge Base v1.0 — Emergency triage, wound care, waterborne illness treatment, basic pharmacology for resource-limited settings.",
    domain: "field_medicine",
    version: "1.0.0",
  },
  {
    content: "Prometheus Ethnobotany Amazon Knowledge Base v1.0 — Medicinal plants of the Amazon basin, preparation methods, dosage guidance, seasonal availability.",
    domain: "ethnobotany_amazon",
    version: "1.0.0",
  },
  {
    content: "Prometheus Agriculture Temperate Knowledge Base v1.0 — Crop rotation, soil management, pest control, water conservation for temperate climate subsistence farming.",
    domain: "agriculture_temperate",
    version: "1.0.0",
  },
];

function hashContent(content) {
  return "0x" + crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
  const contractId = ContractId.fromString(process.env.KNOWLEDGE_REGISTRY_ADDRESS);
  const topicId = TopicId.fromString(process.env.KNOWLEDGE_TOPIC_ID);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(50));

  console.log("Anchoring knowledge bases on-chain and to HCS...\n");
  console.log(`Registry contract: ${contractId}`);
  console.log(`HCS Topic:         ${topicId}\n`);

  for (const kb of KNOWLEDGE_BASES) {
    const contentHash = hashContent(kb.content);
    console.log(`Anchoring: ${kb.domain} v${kb.version}`);
    console.log(`  Hash: ${contentHash}`);

    // 1. Anchor on-chain via smart contract
    const anchorTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1_000_000)
      .setFunction(
        "anchorKnowledgeBase",
        new ContractFunctionParameters()
          .addBytes32(Buffer.from(contentHash.slice(2), "hex"))
          .addString(kb.domain)
          .addString(kb.version)
      )
      .execute(client);

    const receipt = await anchorTx.getReceipt(client);
    console.log(`  Contract TX status: ${receipt.status}`);

    // 2. Submit to HCS topic for audit trail
    const hcsMessage = JSON.stringify({
      hash: contentHash,
      domain: kb.domain,
      version: kb.version,
      timestamp: new Date().toISOString(),
    });

    const hcsTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(hcsMessage)
      .execute(client);

    const hcsReceipt = await hcsTx.getReceipt(client);
    console.log(`  HCS TX status:      ${hcsReceipt.status}\n`);
  }

  // Query registry summary
  const summaryQuery = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction("getSummary")
    .execute(client);

  const totalEntries = summaryQuery.getUint256(0);
  const totalDomains = summaryQuery.getUint256(1);

  console.log("Registry State:");
  console.log("=".repeat(40));
  console.log(`Total entries:  ${totalEntries}`);
  console.log(`Total domains:  ${totalDomains}`);
  console.log("=".repeat(40));

  // Verify one hash to demonstrate the verification flow
  const verifyHash = hashContent(KNOWLEDGE_BASES[0].content);
  console.log(`\nVerifying hash: ${verifyHash}`);

  const verifyQuery = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction(
      "verifyKnowledgeBase",
      new ContractFunctionParameters().addBytes32(
        Buffer.from(verifyHash.slice(2), "hex")
      )
    )
    .execute(client);

  const isValid = verifyQuery.getBool(0);
  console.log(`  Valid: ${isValid}`);
}

main().catch((err) => {
  console.error("Knowledge anchoring failed:", err);
  process.exit(1);
});
