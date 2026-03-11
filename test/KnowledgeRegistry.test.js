const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KnowledgeRegistry", function () {
  let registry;
  let owner, other;

  const HASH_1 = ethers.keccak256(ethers.toUtf8Bytes("field_medicine_v1"));
  const HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("field_medicine_v2"));
  const HASH_3 = ethers.keccak256(ethers.toUtf8Bytes("ethnobotany_v1"));

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("KnowledgeRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("anchorKnowledgeBase", function () {
    it("anchors a knowledge base and emits event", async function () {
      await expect(registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0"))
        .to.emit(registry, "KnowledgeBaseAnchored")
        .withArgs(HASH_1, "field_medicine", "1.0.0", owner.address, (v) => v > 0);

      expect(await registry.totalEntries()).to.equal(1);
    });

    it("registers a new domain on first entry", async function () {
      await expect(registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0"))
        .to.emit(registry, "DomainRegistered");

      const domains = await registry.getAllDomains();
      expect(domains).to.include("field_medicine");
    });

    it("tracks version history for a domain", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await registry.anchorKnowledgeBase(HASH_2, "field_medicine", "2.0.0");

      expect(await registry.getVersionCount("field_medicine")).to.equal(2);
      expect(await registry.latestVersionByDomain("field_medicine")).to.equal(HASH_2);
    });

    it("rejects zero hash", async function () {
      await expect(registry.anchorKnowledgeBase(ethers.ZeroHash, "domain", "1.0"))
        .to.be.revertedWith("Hash cannot be zero");
    });

    it("rejects duplicate hash", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await expect(registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.1"))
        .to.be.revertedWith("Hash already registered");
    });

    it("only owner can anchor", async function () {
      await expect(registry.connect(other).anchorKnowledgeBase(HASH_1, "domain", "1.0"))
        .to.be.revertedWith("Only owner");
    });
  });

  describe("verifyKnowledgeBase", function () {
    it("returns valid for a registered hash", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      const result = await registry.verifyKnowledgeBase(HASH_1);
      expect(result.isValid).to.equal(true);
      expect(result.domain).to.equal("field_medicine");
      expect(result.version).to.equal("1.0.0");
    });

    it("returns invalid for unknown hash", async function () {
      const result = await registry.verifyKnowledgeBase(HASH_1);
      expect(result.isValid).to.equal(false);
    });

    it("returns invalid for deprecated hash", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await registry.deprecateKnowledgeBase(HASH_1, "outdated");
      const result = await registry.verifyKnowledgeBase(HASH_1);
      expect(result.isValid).to.equal(false);
    });
  });

  describe("deprecateKnowledgeBase", function () {
    it("deprecates and emits event", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await expect(registry.deprecateKnowledgeBase(HASH_1, "outdated"))
        .to.emit(registry, "KnowledgeBaseDeprecated");
    });

    it("cannot deprecate twice", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await registry.deprecateKnowledgeBase(HASH_1, "outdated");
      await expect(registry.deprecateKnowledgeBase(HASH_1, "again"))
        .to.be.revertedWith("Already deprecated");
    });
  });

  describe("View functions", function () {
    it("getLatestVersion returns correct data", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      const latest = await registry.getLatestVersion("field_medicine");
      expect(latest.contentHash).to.equal(HASH_1);
      expect(latest.version).to.equal("1.0.0");
    });

    it("getSummary returns correct counts", async function () {
      await registry.anchorKnowledgeBase(HASH_1, "field_medicine", "1.0.0");
      await registry.anchorKnowledgeBase(HASH_3, "ethnobotany", "1.0.0");
      const summary = await registry.getSummary();
      expect(summary._totalEntries).to.equal(2);
      expect(summary._totalDomains).to.equal(2);
    });
  });
});
