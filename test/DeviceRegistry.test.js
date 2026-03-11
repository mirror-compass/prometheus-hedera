const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeviceRegistry", function () {
  let registry;
  let owner, partner;

  const KB_HASH = ethers.keccak256(ethers.toUtf8Bytes("knowledge_base_v1"));

  beforeEach(async function () {
    [owner, partner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("DeviceRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("registerDevice", function () {
    it("registers a device and emits event", async function () {
      await expect(registry.registerDevice(KB_HASH, "Amazon Basin", 1)) // 1 = Funded
        .to.emit(registry, "DeviceRegistered");

      expect(await registry.totalDevices()).to.equal(1);
      const device = await registry.getDevice(1);
      expect(device.region).to.equal("Amazon Basin");
      expect(device.status).to.equal(0); // Assembled
    });

    it("tracks regions", async function () {
      await registry.registerDevice(KB_HASH, "Amazon Basin", 0);
      await registry.registerDevice(KB_HASH, "Sub-Saharan Africa", 1);
      const regions = await registry.getAllRegions();
      expect(regions.length).to.equal(2);
    });

    it("rejects zero knowledge hash", async function () {
      await expect(registry.registerDevice(ethers.ZeroHash, "Region", 0))
        .to.be.revertedWith("Knowledge hash required");
    });

    it("only owner can register", async function () {
      await expect(registry.connect(partner).registerDevice(KB_HASH, "Region", 0))
        .to.be.revertedWith("Only owner");
    });
  });

  describe("Device lifecycle", function () {
    beforeEach(async function () {
      await registry.registerDevice(KB_HASH, "Amazon Basin", 1);
    });

    it("marks shipped", async function () {
      await expect(registry.markShipped(1, "Red Cross"))
        .to.emit(registry, "DeviceShipped");
      const d = await registry.getDevice(1);
      expect(d.status).to.equal(1); // Shipped
      expect(d.partnerOrg).to.equal("Red Cross");
    });

    it("confirms deployment after shipping", async function () {
      await registry.markShipped(1, "Red Cross");
      await expect(registry.connect(partner).confirmDeployment(1))
        .to.emit(registry, "DeviceDeployed");
      const d = await registry.getDevice(1);
      expect(d.status).to.equal(2); // Deployed
    });

    it("confirms activation after deployment", async function () {
      await registry.markShipped(1, "Red Cross");
      await registry.connect(partner).confirmDeployment(1);
      await expect(registry.connect(partner).confirmActivation(1))
        .to.emit(registry, "DeviceActivated");

      expect(await registry.activeDevices()).to.equal(1);
      expect(await registry.devicesByRegion("Amazon Basin")).to.equal(1);
    });

    it("decommissions an active device", async function () {
      await registry.markShipped(1, "Red Cross");
      await registry.connect(partner).confirmDeployment(1);
      await registry.connect(partner).confirmActivation(1);
      await registry.decommissionDevice(1, "Hardware failure");

      const d = await registry.getDevice(1);
      expect(d.status).to.equal(4); // Decommissioned
      expect(await registry.activeDevices()).to.equal(0);
    });

    it("rejects invalid status transitions", async function () {
      // Can't ship twice
      await registry.markShipped(1, "Red Cross");
      await expect(registry.markShipped(1, "Other"))
        .to.be.revertedWith("Invalid status transition");
    });
  });

  describe("View functions", function () {
    it("getSummary returns correct data", async function () {
      await registry.registerDevice(KB_HASH, "Amazon Basin", 1);
      await registry.registerDevice(KB_HASH, "Southeast Asia", 0);

      const summary = await registry.getSummary();
      expect(summary._totalDevices).to.equal(2);
      expect(summary._activeDevices).to.equal(0);
      expect(summary._totalRegions).to.equal(2);
    });
  });
});
