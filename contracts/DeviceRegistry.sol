// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

/**
 * @title DeviceRegistry
 * @notice Tracks the lifecycle of every Prometheus device from assembly
 *         through deployment to community activation. Each device is
 *         registered with its knowledge base version hash, enabling
 *         end-to-end verification of content integrity.
 * 
 * @dev In the full implementation, each device would be represented as
 *      an HTS NFT via the precompile. For the hackathon MVP, we use
 *      contract-native tracking with events that the dashboard reads
 *      via Mirror Node.
 * 
 *      Hackathon MVP scope:
 *      - Register devices with metadata (region, knowledge hash, type)
 *      - Track device status (assembled, shipped, deployed, active)
 *      - Partner organization deployment confirmation
 *      - Dashboard-friendly view functions and events
 *      
 *      Post-hackathon:
 *      - HTS NFT minting per device
 *      - Device telemetry anchoring (optional, privacy-preserving)
 *      - Community feedback loop on-chain
 */
contract DeviceRegistry {
    
    // ═══════════════════ STATE ═══════════════════
    
    address public owner;
    
    enum DeviceStatus {
        Assembled,    // Built and loaded with knowledge bases
        Shipped,      // In transit to partner organization
        Deployed,     // Received by partner, awaiting activation
        Active,       // Confirmed active in the field
        Decommissioned // End of life or replaced
    }
    
    enum DeviceType {
        Commercial,   // Purchased by a consumer
        Funded,       // Funded through the buy-one-fund-one model
        Community     // Built from open-source plans by a community
    }
    
    struct Device {
        uint256 id;
        bytes32 knowledgeBaseHash;   // Hash of knowledge bases loaded on device
        string region;               // Target deployment region
        string partnerOrg;           // Receiving organization (for funded devices)
        DeviceStatus status;
        DeviceType deviceType;
        uint256 assembledAt;
        uint256 deployedAt;
        uint256 activatedAt;
    }
    
    /// @notice Total devices registered
    uint256 public totalDevices;
    
    /// @notice Total devices confirmed active in the field
    uint256 public activeDevices;
    
    /// @notice Device ID => Device record
    mapping(uint256 => Device) public devices;
    
    /// @notice Region => count of active devices
    mapping(string => uint256) public devicesByRegion;
    
    /// @notice All regions with at least one device
    string[] public regions;
    mapping(string => bool) private regionExists;
    
    // ═══════════════════ EVENTS ═══════════════════
    
    event DeviceRegistered(
        uint256 indexed deviceId,
        string region,
        bytes32 knowledgeBaseHash,
        DeviceType deviceType,
        uint256 timestamp
    );
    
    event DeviceShipped(
        uint256 indexed deviceId,
        string partnerOrg,
        uint256 timestamp
    );
    
    event DeviceDeployed(
        uint256 indexed deviceId,
        string partnerOrg,
        string region,
        uint256 timestamp
    );
    
    event DeviceActivated(
        uint256 indexed deviceId,
        string region,
        uint256 timestamp
    );
    
    event DeviceDecommissioned(
        uint256 indexed deviceId,
        string reason,
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
    
    /// @notice Register a newly assembled Prometheus device
    /// @param _knowledgeBaseHash Hash of the knowledge bases loaded on device
    /// @param _region Target deployment region
    /// @param _deviceType Whether commercial, funded, or community-built
    function registerDevice(
        bytes32 _knowledgeBaseHash,
        string calldata _region,
        DeviceType _deviceType
    ) external onlyOwner returns (uint256 deviceId) {
        require(_knowledgeBaseHash != bytes32(0), "Knowledge hash required");
        require(bytes(_region).length > 0, "Region required");
        
        totalDevices += 1;
        deviceId = totalDevices;
        
        devices[deviceId] = Device({
            id: deviceId,
            knowledgeBaseHash: _knowledgeBaseHash,
            region: _region,
            partnerOrg: "",
            status: DeviceStatus.Assembled,
            deviceType: _deviceType,
            assembledAt: block.timestamp,
            deployedAt: 0,
            activatedAt: 0
        });
        
        // Track regions
        if (!regionExists[_region]) {
            regions.push(_region);
            regionExists[_region] = true;
        }
        
        emit DeviceRegistered(
            deviceId,
            _region,
            _knowledgeBaseHash,
            _deviceType,
            block.timestamp
        );
        
        return deviceId;
    }
    
    /// @notice Mark a device as shipped to a partner organization
    /// @param _deviceId Device to update
    /// @param _partnerOrg Receiving organization
    function markShipped(uint256 _deviceId, string calldata _partnerOrg) external onlyOwner {
        Device storage d = devices[_deviceId];
        require(d.id > 0, "Device not found");
        require(d.status == DeviceStatus.Assembled, "Invalid status transition");
        
        d.status = DeviceStatus.Shipped;
        d.partnerOrg = _partnerOrg;
        
        emit DeviceShipped(_deviceId, _partnerOrg, block.timestamp);
    }
    
    /// @notice Partner confirms device receipt
    /// @param _deviceId Device to confirm
    function confirmDeployment(uint256 _deviceId) external {
        Device storage d = devices[_deviceId];
        require(d.id > 0, "Device not found");
        require(
            d.status == DeviceStatus.Shipped || d.status == DeviceStatus.Assembled,
            "Invalid status transition"
        );
        
        d.status = DeviceStatus.Deployed;
        d.deployedAt = block.timestamp;
        
        emit DeviceDeployed(_deviceId, d.partnerOrg, d.region, block.timestamp);
    }
    
    /// @notice Confirm device is active and serving a community
    /// @param _deviceId Device to activate
    function confirmActivation(uint256 _deviceId) external {
        Device storage d = devices[_deviceId];
        require(d.id > 0, "Device not found");
        require(d.status == DeviceStatus.Deployed, "Must be deployed first");
        
        d.status = DeviceStatus.Active;
        d.activatedAt = block.timestamp;
        activeDevices += 1;
        devicesByRegion[d.region] += 1;
        
        emit DeviceActivated(_deviceId, d.region, block.timestamp);
    }
    
    /// @notice Decommission a device
    /// @param _deviceId Device to decommission
    /// @param _reason Reason for decommission
    function decommissionDevice(uint256 _deviceId, string calldata _reason) external onlyOwner {
        Device storage d = devices[_deviceId];
        require(d.id > 0, "Device not found");
        require(d.status != DeviceStatus.Decommissioned, "Already decommissioned");
        
        if (d.status == DeviceStatus.Active) {
            activeDevices -= 1;
            devicesByRegion[d.region] -= 1;
        }
        
        d.status = DeviceStatus.Decommissioned;
        
        emit DeviceDecommissioned(_deviceId, _reason, block.timestamp);
    }
    
    // ═══════════════════ VIEW FUNCTIONS ═══════════════════
    
    /// @notice Get full device record
    function getDevice(uint256 _deviceId) external view returns (Device memory) {
        require(devices[_deviceId].id > 0, "Device not found");
        return devices[_deviceId];
    }
    
    /// @notice Get all regions with devices
    function getAllRegions() external view returns (string[] memory) {
        return regions;
    }
    
    /// @notice Get dashboard summary
    function getSummary() external view returns (
        uint256 _totalDevices,
        uint256 _activeDevices,
        uint256 _totalRegions
    ) {
        return (totalDevices, activeDevices, regions.length);
    }
}
