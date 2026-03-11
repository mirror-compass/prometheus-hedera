const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrometheusImpact", function () {
  let impact;
  let owner, buyer, partner;

  const SPLIT_BPS = 2000; // 20%
  const DEVICE_COST = ethers.parseEther("1"); // 1 ETH (stands in for HBAR on local)

  beforeEach(async function () {
    [owner, buyer, partner] = await ethers.getSigners();
    const Impact = await ethers.getContractFactory("PrometheusImpact");
    impact = await Impact.deploy(SPLIT_BPS, DEVICE_COST);
    await impact.waitForDeployment();
  });

  describe("Constructor", function () {
    it("sets owner, split ratio, and device cost", async function () {
      expect(await impact.owner()).to.equal(owner.address);
      expect(await impact.deploymentSplitBps()).to.equal(SPLIT_BPS);
      expect(await impact.deviceDeploymentCost()).to.equal(DEVICE_COST);
    });

    it("rejects split > 100%", async function () {
      const Impact = await ethers.getContractFactory("PrometheusImpact");
      await expect(Impact.deploy(10001, DEVICE_COST)).to.be.revertedWith("Split cannot exceed 100%");
    });

    it("rejects zero device cost", async function () {
      const Impact = await ethers.getContractFactory("PrometheusImpact");
      await expect(Impact.deploy(SPLIT_BPS, 0)).to.be.revertedWith("Device cost must be positive");
    });
  });

  describe("recordPurchase", function () {
    it("splits funds correctly", async function () {
      const amount = ethers.parseEther("10");
      await impact.connect(buyer).recordPurchase({ value: amount });

      expect(await impact.totalFundsReceived()).to.equal(amount);
      expect(await impact.totalPurchases()).to.equal(1);
      // 20% of 10 = 2
      expect(await impact.deploymentFundBalance()).to.equal(ethers.parseEther("2"));
    });

    it("emits PurchaseRecorded event", async function () {
      const amount = ethers.parseEther("5");
      await expect(impact.connect(buyer).recordPurchase({ value: amount }))
        .to.emit(impact, "PurchaseRecorded")
        .withArgs(buyer.address, amount, ethers.parseEther("1"), (v) => v > 0);
    });

    it("emits DeploymentFundReady when threshold met", async function () {
      const amount = ethers.parseEther("5"); // 20% = 1 ETH = device cost
      await expect(impact.connect(buyer).recordPurchase({ value: amount }))
        .to.emit(impact, "DeploymentFundReady");
    });

    it("reverts with zero payment", async function () {
      await expect(impact.connect(buyer).recordPurchase({ value: 0 }))
        .to.be.revertedWith("Payment required");
    });
  });

  describe("initiateDeployment", function () {
    beforeEach(async function () {
      // Fund enough for one deployment (need 1 ETH in deployment fund = 5 ETH purchase at 20%)
      await impact.connect(buyer).recordPurchase({ value: ethers.parseEther("5") });
    });

    it("creates a deployment and decrements fund", async function () {
      await impact.initiateDeployment("Sub-Saharan Africa", "Doctors Without Borders");
      expect(await impact.totalDeployments()).to.equal(1);
      expect(await impact.deploymentFundBalance()).to.equal(0);

      const d = await impact.getDeployment(1);
      expect(d.region).to.equal("Sub-Saharan Africa");
      expect(d.partnerOrg).to.equal("Doctors Without Borders");
      expect(d.confirmed).to.equal(false);
    });

    it("reverts if insufficient funds", async function () {
      await impact.initiateDeployment("Region A", "Org A"); // uses up the fund
      await expect(impact.initiateDeployment("Region B", "Org B"))
        .to.be.revertedWith("Insufficient deployment funds");
    });

    it("only owner can initiate", async function () {
      await expect(impact.connect(buyer).initiateDeployment("Region", "Org"))
        .to.be.revertedWith("Only owner");
    });
  });

  describe("confirmDeployment", function () {
    beforeEach(async function () {
      await impact.connect(buyer).recordPurchase({ value: ethers.parseEther("5") });
      await impact.initiateDeployment("Amazon Basin", "Red Cross");
    });

    it("confirms a deployment", async function () {
      await impact.connect(partner).confirmDeployment(1);
      const d = await impact.getDeployment(1);
      expect(d.confirmed).to.equal(true);
    });

    it("reverts on non-existent deployment", async function () {
      await expect(impact.confirmDeployment(999))
        .to.be.revertedWith("Deployment does not exist");
    });

    it("reverts on double confirmation", async function () {
      await impact.confirmDeployment(1);
      await expect(impact.confirmDeployment(1))
        .to.be.revertedWith("Already confirmed");
    });
  });

  describe("Admin functions", function () {
    it("updates split ratio", async function () {
      await expect(impact.updateSplitRatio(3000))
        .to.emit(impact, "SplitRatioUpdated")
        .withArgs(2000, 3000);
      expect(await impact.deploymentSplitBps()).to.equal(3000);
    });

    it("withdraws operational funds", async function () {
      await impact.connect(buyer).recordPurchase({ value: ethers.parseEther("10") });
      // Operational = 80% of 10 = 8 ETH
      const balBefore = await ethers.provider.getBalance(partner.address);
      await impact.withdrawOperational(ethers.parseEther("8"), partner.address);
      const balAfter = await ethers.provider.getBalance(partner.address);
      expect(balAfter - balBefore).to.equal(ethers.parseEther("8"));
    });
  });

  describe("View functions", function () {
    it("getSummary returns correct data", async function () {
      await impact.connect(buyer).recordPurchase({ value: ethers.parseEther("10") });
      const summary = await impact.getSummary();
      expect(summary._totalPurchases).to.equal(1);
      expect(summary._totalFundsReceived).to.equal(ethers.parseEther("10"));
      expect(summary._deploymentFundBalance).to.equal(ethers.parseEther("2"));
      expect(summary._deployableDevices).to.equal(2); // 2 ETH fund / 1 ETH cost
    });
  });
});
