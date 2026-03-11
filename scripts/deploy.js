/**
 * deploy.js — Deploy all Prometheus contracts to Hedera Testnet
 *
 * Uses @hashgraph/sdk to:
 * 1. Create an HCS topic for the knowledge audit trail
 * 2. Deploy PrometheusImpact contract
 * 3. Deploy KnowledgeRegistry contract
 * 4. Deploy DeviceRegistry contract
 * 5. Output all addresses and IDs for .env and dashboard config
 *
 * Usage: node scripts/deploy.js
 *
 * Prerequisites:
 * - .env file with HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY
 * - Contracts compiled: npx hardhat compile
 */

require("dotenv").config();
const fs = require("fs");
const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  TopicCreateTransaction,
  Hbar,
} = require("@hashgraph/sdk");

// Device cost: 100 HBAR (in tinybars). Adjust as needed.
const DEVICE_COST_HBAR = 100;
const DEVICE_COST_TINYBARS = DEVICE_COST_HBAR * 100_000_000; // 10 billion tinybars
const DEPLOYMENT_SPLIT_BPS = 2000; // 20%

function loadBytecode(contractName) {
  const artifact = JSON.parse(
    fs.readFileSync(
      `artifacts/contracts/${contractName}.sol/${contractName}.json`,
      "utf8"
    )
  );
  return artifact.bytecode;
}

async function main() {
  console.log("Deploying Project Prometheus to Hedera Testnet...\n");

  // 1. Initialize Hedera client
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(100));

  console.log(`Operator: ${accountId}`);
  console.log(`Network:  testnet\n`);

  // 2. Create HCS topic for knowledge audit trail
  console.log("[1/4] Creating HCS topic for knowledge audit trail...");
  const topicTx = await new TopicCreateTransaction()
    .setTopicMemo("Prometheus Knowledge Audit Trail")
    .setAdminKey(privateKey)
    .setSubmitKey(privateKey)
    .execute(client);
  const topicReceipt = await topicTx.getReceipt(client);
  const topicId = topicReceipt.topicId;
  console.log(`  HCS Topic ID: ${topicId}\n`);

  // 3. Deploy PrometheusImpact
  console.log("[2/4] Deploying PrometheusImpact...");
  const impactBytecode = loadBytecode("PrometheusImpact");
  const impactTx = await new ContractCreateFlow()
    .setBytecode(impactBytecode)
    .setGas(1_500_000)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addUint256(DEPLOYMENT_SPLIT_BPS)
        .addUint256(DEVICE_COST_TINYBARS)
    )
    .execute(client);
  const impactReceipt = await impactTx.getReceipt(client);
  const impactContractId = impactReceipt.contractId;
  console.log(`  PrometheusImpact Contract ID: ${impactContractId}`);
  console.log(`  PrometheusImpact EVM Address: ${impactContractId.toSolidityAddress()}\n`);

  // 4. Deploy KnowledgeRegistry
  console.log("[3/4] Deploying KnowledgeRegistry...");
  const knowledgeBytecode = loadBytecode("KnowledgeRegistry");
  const knowledgeTx = await new ContractCreateFlow()
    .setBytecode(knowledgeBytecode)
    .setGas(1_500_000)
    .execute(client);
  const knowledgeReceipt = await knowledgeTx.getReceipt(client);
  const knowledgeContractId = knowledgeReceipt.contractId;
  console.log(`  KnowledgeRegistry Contract ID: ${knowledgeContractId}`);
  console.log(`  KnowledgeRegistry EVM Address: ${knowledgeContractId.toSolidityAddress()}\n`);

  // 5. Deploy DeviceRegistry
  console.log("[4/4] Deploying DeviceRegistry...");
  const deviceBytecode = loadBytecode("DeviceRegistry");
  const deviceTx = await new ContractCreateFlow()
    .setBytecode(deviceBytecode)
    .setGas(1_500_000)
    .execute(client);
  const deviceReceipt = await deviceTx.getReceipt(client);
  const deviceContractId = deviceReceipt.contractId;
  console.log(`  DeviceRegistry Contract ID: ${deviceContractId}`);
  console.log(`  DeviceRegistry EVM Address: ${deviceContractId.toSolidityAddress()}\n`);

  // 6. Summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`HCS Topic ID:              ${topicId}`);
  console.log(`PrometheusImpact:          ${impactContractId} (0x${impactContractId.toSolidityAddress()})`);
  console.log(`KnowledgeRegistry:         ${knowledgeContractId} (0x${knowledgeContractId.toSolidityAddress()})`);
  console.log(`DeviceRegistry:            ${deviceContractId} (0x${deviceContractId.toSolidityAddress()})`);
  console.log(`Deployment Split:          ${DEPLOYMENT_SPLIT_BPS / 100}%`);
  console.log(`Device Cost:               ${DEVICE_COST_HBAR} HBAR`);
  console.log("=".repeat(60));

  console.log("\nAdd these to your .env:");
  console.log(`PROMETHEUS_IMPACT_ADDRESS=${impactContractId}`);
  console.log(`KNOWLEDGE_REGISTRY_ADDRESS=${knowledgeContractId}`);
  console.log(`DEVICE_REGISTRY_ADDRESS=${deviceContractId}`);
  console.log(`KNOWLEDGE_TOPIC_ID=${topicId}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
