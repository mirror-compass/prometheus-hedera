/**
 * simulate-purchase.js — Simulate a device purchase on PrometheusImpact
 *
 * Sends HBAR to the contract's recordPurchase() function, which splits
 * funds between operational revenue and the deployment fund.
 *
 * Usage: node scripts/simulate-purchase.js
 */

require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  ContractId,
} = require("@hashgraph/sdk");

const PURCHASE_AMOUNT_HBAR = 500; // Simulated device purchase price

async function main() {
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
  const contractId = ContractId.fromString(process.env.PROMETHEUS_IMPACT_ADDRESS);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(50));

  console.log("Simulating device purchase...\n");
  console.log(`Contract:        ${contractId}`);
  console.log(`Purchase amount: ${PURCHASE_AMOUNT_HBAR} HBAR`);
  console.log(`Buyer:           ${accountId}\n`);

  // Call recordPurchase() with HBAR payment
  const purchaseTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(300_000)
    .setPayableAmount(new Hbar(PURCHASE_AMOUNT_HBAR))
    .setFunction("recordPurchase")
    .execute(client);

  const receipt = await purchaseTx.getReceipt(client);
  console.log(`Transaction status: ${receipt.status}`);
  console.log(`Transaction ID:     ${purchaseTx.transactionId}\n`);

  // Query contract summary
  const summaryQuery = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction("getSummary")
    .execute(client);

  const totalPurchases = summaryQuery.getUint256(0);
  const totalFundsReceived = summaryQuery.getUint256(1);
  const deploymentFundBalance = summaryQuery.getUint256(2);
  const totalDeployments = summaryQuery.getUint256(3);
  const deployableDevices = summaryQuery.getUint256(4);
  const splitBps = summaryQuery.getUint256(5);

  console.log("Contract State After Purchase:");
  console.log("=".repeat(45));
  console.log(`Total purchases:        ${totalPurchases}`);
  console.log(`Total funds received:   ${Number(totalFundsReceived) / 1e8} HBAR`);
  console.log(`Deployment fund:        ${Number(deploymentFundBalance) / 1e8} HBAR`);
  console.log(`Total deployments:      ${totalDeployments}`);
  console.log(`Deployable devices:     ${deployableDevices}`);
  console.log(`Split ratio:            ${Number(splitBps) / 100}%`);
  console.log("=".repeat(45));
}

main().catch((err) => {
  console.error("Purchase simulation failed:", err);
  process.exit(1);
});
