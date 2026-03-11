// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

/**
 * @title KnowledgeRegistry
 * @notice Anchors knowledge base hashes on-chain for integrity verification.
 *         Each curated knowledge base (medical, botany, agriculture, etc.)
 *         is hashed and registered here. Prometheus devices can verify their
 *         local content against this registry.
 * 
 * @dev Also submits hashes to an HCS topic via the Hedera SDK (off-chain script),
 *      creating a parallel immutable audit trail. The contract provides the
 *      on-chain queryable registry; HCS provides the ordered message log.
 * 
 *      Hackathon MVP scope:
 *      - Register knowledge base hashes with domain and version metadata
 *      - Public verification function
 *      - Latest version lookup by domain
 *      - Event emission for Mirror Node dashboard
 *      
 *      Post-hackathon:
 *      - Governance-gated additions (require vote before anchoring)
 *      - Multi-curator support with reputation tracking
 *      - Cross-device sync verification
 */
contract KnowledgeRegistry {
    
    // ═══════════════════ STATE ═══════════════════
    
    address public owner;
    
    /// @notice Total number of knowledge bases registered
    uint256 public totalEntries;
    
    struct KnowledgeBase {
        bytes32 contentHash;
        string domain;       // e.g., "field_medicine", "ethnobotany_amazon", "agriculture_temperate"
        string version;      // e.g., "1.0.0", "2.1.0"
        address curator;     // Who submitted this version
        uint256 timestamp;
        bool active;         // Can be deprecated but not deleted
    }
    
    /// @notice Hash => KnowledgeBase record
    mapping(bytes32 => KnowledgeBase) public knowledgeBases;
    
    /// @notice Domain => latest content hash
    mapping(string => bytes32) public latestVersionByDomain;
    
    /// @notice Domain => array of all version hashes (history)
    mapping(string => bytes32[]) public versionHistory;
    
    /// @notice All registered domain names
    string[] public domains;
    mapping(string => bool) private domainExists;
    
    // ═══════════════════ EVENTS ═══════════════════
    
    event KnowledgeBaseAnchored(
        bytes32 indexed contentHash,
        string domain,
        string version,
        address indexed curator,
        uint256 timestamp
    );
    
    event KnowledgeBaseDeprecated(
        bytes32 indexed contentHash,
        string domain,
        string reason,
        uint256 timestamp
    );
    
    event DomainRegistered(
        string domain,
        uint256 timestamp
    );
    
    // ═══════════════════ MODIFIERS ═══════════════════
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ═══════════════════ CONSTRUCTOR ═══════════════════
    
    constructor() {
        owner = msg.sender;
    }
    
    // ═══════════════════ CORE FUNCTIONS ═══════════════════
    
    /// @notice Anchor a new knowledge base hash on-chain
    /// @param _contentHash SHA-256 hash of the knowledge base content
    /// @param _domain Knowledge domain identifier
    /// @param _version Semantic version string
    function anchorKnowledgeBase(
        bytes32 _contentHash,
        string calldata _domain,
        string calldata _version
    ) external onlyOwner {
        require(_contentHash != bytes32(0), "Hash cannot be zero");
        require(bytes(_domain).length > 0, "Domain required");
        require(bytes(_version).length > 0, "Version required");
        require(knowledgeBases[_contentHash].timestamp == 0, "Hash already registered");
        
        // Register the knowledge base
        knowledgeBases[_contentHash] = KnowledgeBase({
            contentHash: _contentHash,
            domain: _domain,
            version: _version,
            curator: msg.sender,
            timestamp: block.timestamp,
            active: true
        });
        
        // Update latest version pointer
        latestVersionByDomain[_domain] = _contentHash;
        
        // Add to version history
        versionHistory[_domain].push(_contentHash);
        
        // Track new domains
        if (!domainExists[_domain]) {
            domains.push(_domain);
            domainExists[_domain] = true;
            emit DomainRegistered(_domain, block.timestamp);
        }
        
        totalEntries += 1;
        
        emit KnowledgeBaseAnchored(
            _contentHash,
            _domain,
            _version,
            msg.sender,
            block.timestamp
        );
    }
    
    /// @notice Verify a knowledge base hash against the registry
    /// @param _contentHash Hash to verify
    /// @return isValid Whether the hash exists and is active
    /// @return domain The knowledge domain
    /// @return version The version string
    /// @return curator Who anchored this version
    /// @return timestamp When it was anchored
    function verifyKnowledgeBase(bytes32 _contentHash) external view returns (
        bool isValid,
        string memory domain,
        string memory version,
        address curator,
        uint256 timestamp
    ) {
        KnowledgeBase memory kb = knowledgeBases[_contentHash];
        
        if (kb.timestamp == 0) {
            return (false, "", "", address(0), 0);
        }
        
        return (
            kb.active,
            kb.domain,
            kb.version,
            kb.curator,
            kb.timestamp
        );
    }
    
    /// @notice Check if a hash matches the latest version for a domain
    /// @param _contentHash Hash to check
    /// @param _domain Domain to check against
    /// @return isLatest Whether this hash is the current latest version
    function isLatestVersion(bytes32 _contentHash, string calldata _domain) external view returns (bool) {
        return latestVersionByDomain[_domain] == _contentHash;
    }
    
    /// @notice Deprecate a knowledge base version (e.g., outdated medical info)
    /// @param _contentHash Hash of the version to deprecate
    /// @param _reason Reason for deprecation
    function deprecateKnowledgeBase(
        bytes32 _contentHash,
        string calldata _reason
    ) external onlyOwner {
        KnowledgeBase storage kb = knowledgeBases[_contentHash];
        require(kb.timestamp > 0, "Hash not registered");
        require(kb.active, "Already deprecated");
        
        kb.active = false;
        
        emit KnowledgeBaseDeprecated(
            _contentHash,
            kb.domain,
            _reason,
            block.timestamp
        );
    }
    
    // ═══════════════════ VIEW FUNCTIONS ═══════════════════
    
    /// @notice Get the latest knowledge base info for a domain
    function getLatestVersion(string calldata _domain) external view returns (
        bytes32 contentHash,
        string memory version,
        address curator,
        uint256 timestamp,
        bool active
    ) {
        bytes32 latestHash = latestVersionByDomain[_domain];
        require(latestHash != bytes32(0), "Domain not found");
        
        KnowledgeBase memory kb = knowledgeBases[latestHash];
        return (kb.contentHash, kb.version, kb.curator, kb.timestamp, kb.active);
    }
    
    /// @notice Get the number of versions for a domain
    function getVersionCount(string calldata _domain) external view returns (uint256) {
        return versionHistory[_domain].length;
    }
    
    /// @notice Get all registered domain names
    function getAllDomains() external view returns (string[] memory) {
        return domains;
    }
    
    /// @notice Get a summary for the dashboard
    function getSummary() external view returns (
        uint256 _totalEntries,
        uint256 _totalDomains
    ) {
        return (totalEntries, domains.length);
    }
}
