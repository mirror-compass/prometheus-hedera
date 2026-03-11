/**
 * register-device.js — Register and deploy a Prometheus device
 *
 * Demonstrates the full device lifecycle:
 * 1. Register a new device with knowledge base hash
 * 2. Mark it as shipped to a partner org
 * 3. Confirm deployment
 * 4. Confirm activation
 *
 * Usage: node scripts/register-device.js
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
  ContractId,
  Hbar,
} = require("@hashgraph/sdk");

// Sample devices to register
const DEVICES = [
  {
    knowledgeContent: "Prometheus Field Medicine Knowledge Base v1.0",
    region: "Amazon Basin, Brazil",
    deviceType: 1, // Funded
    partnerOrg: "Medicos Sem Fronteiras",
  },
  {
    knowledgeContent: "Prometheus Agriculture Temperate Knowledge Base v1.0",
    region: "Sub-Saharan Africa, Kenya",
    deviceType: 1, // Funded
    partnerOrg: "Kenya Red Cross",
  },
  {
    knowledgeContent: "Prometheus Ethnobotany Amazon Knowledge Base v1.0",
    region: "Southeast Asia, Cambodia",
    deviceType: 0, // Commercial
    partnerOrg: "Cambodia Rural Health Initiative",
  },
];

function hashContent(content) {
  return Buffer.from(
    crypto.createHash("sha256").update(content).digest("hex"),
    "hex"
  );
}

async function main() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
  const contractId = ContractId.fromString(process.env.DEVICE_REGISTRY_ADDRESS);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(50));

  console.log("Registering and deploying Prometheus devices...\n");
  console.log(`Registry contract: ${contractId}\n`);

  const deviceIds = [];

  for (let i = 0; i < DEVICES.length; i++) {
    const device = DEVICES[i];
    const kbHash = hashContent(device.knowledgeContent);
    const typeNames = ["Commercial", "Funded", "Community"];

    console.log(`--- Device ${i + 1}: ${device.region} ---`);
    console.log(`  Type:    ${typeNames[device.deviceType]}`);
    console.log(`  Partner: ${device.partnerOrg}`);

    // 1. Register device
    const registerTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1_000_000)
      .setFunction(
        "registerDevice",
        new ContractFunctionParameters()
          .addBytes32(kbHash)
          .addString(device.region)
          .addUint8(device.deviceType)
      )
      .execute(client);
    const registerReceipt = await registerTx.getReceipt(client);
    console.log(`  [1] Registered:  ${registerReceipt.status}`);

    // Device ID is sequential (i+1)
    const deviceId = i + 1;
    deviceIds.push(deviceId);

    // 2. Mark as shipped
    const shipTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(800_000)
      .setFunction(
        "markShipped",
        new ContractFunctionParameters()
          .addUint256(deviceId)
          .addString(device.partnerOrg)
      )
      .execute(client);
    const shipReceipt = await shipTx.getReceipt(client);
    console.log(`  [2] Shipped:     ${shipReceipt.status}`);

    // 3. Confirm deployment (partner receives device)
    const deployTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(800_000)
      .setFunction(
        "confirmDeployment",
        new ContractFunctionParameters().addUint256(deviceId)
      )
      .execute(client);
    const deployReceipt = await deployTx.getReceipt(client);
    console.log(`  [3] Deployed:    ${deployReceipt.status}`);

    // 4. Confirm activation (device is live in the field)
    const activateTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(800_000)
      .setFunction(
        "confirmActivation",
        new ContractFunctionParameters().addUint256(deviceId)
      )
      .execute(client);
    const activateReceipt = await activateTx.getReceipt(client);
    console.log(`  [4] Activated:   ${activateReceipt.status}\n`);
  }

  // Query registry summary
  const summaryQuery = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction("getSummary")
    .execute(client);

  const totalDevices = summaryQuery.getUint256(0);
  const activeDevices = summaryQuery.getUint256(1);
  const totalRegions = summaryQuery.getUint256(2);

  console.log("Device Registry State:");
  console.log("=".repeat(40));
  console.log(`Total devices:   ${totalDevices}`);
  console.log(`Active devices:  ${activeDevices}`);
  console.log(`Total regions:   ${totalRegions}`);
  console.log("=".repeat(40));
}

main().catch((err) => {
  console.error("Device registration failed:", err);
  process.exit(1);
});
