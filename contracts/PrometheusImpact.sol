// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

/**
 * @title PrometheusImpact
 * @notice Manages the buy-one-fund-one mechanism for Project Prometheus.
 *         Receives payments for device purchases, splits funds between
 *         operational revenue and a humanitarian deployment fund, and
 *         mints impact tokens as verifiable proof of contribution.
 * 
 * @dev Deployed on Hedera Smart Contract Service. Uses HTS precompile
 *      for native token operations.
 * 
 *      Hackathon MVP scope:
 *      - Fund split on purchase (configurable ratio)
 *      - Deployment fund tracking
 *      - Event emission for dashboard consumption via Mirror Node
 *      - Impact token minting to buyer (HTS fungible token)
 *      
 *      Post-hackathon:
 *      - Multi-sig for fund release
 *      - Partner org whitelist for deployment confirmation
 *      - Governance-adjustable split ratio
 */
contract PrometheusImpact {
    
    // ═══════════════════ STATE ═══════════════════
    
    address public owner;
    
    /// @notice Percentage of each purchase allocated to deployment fund (basis points, 2000 = 20%)
    uint256 public deploymentSplitBps;
    
    /// @notice Cost threshold for one device deployment (in tinybars)
    uint256 public deviceDeploymentCost;
    
    /// @notice Running total of funds in the deployment pool
    uint256 public deploymentFundBalance;
    
    /// @notice Running total of all funds received
    uint256 public totalFundsReceived;
    
    /// @notice Total number of purchases recorded
    uint256 public totalPurchases;
    
    /// @notice Total number of funded deployments completed
    uint256 public totalDeployments;
    
    /// @notice Mapping of deployment ID to deployment record
    mapping(uint256 => Deployment) public deployments;
    
    struct Deployment {
        uint256 id;
        string region;
        string partnerOrg;
        uint256 fundedAmount;
        uint256 timestamp;
        bool confirmed;
    }
    
    // ═══════════════════ EVENTS ═══════════════════
    
    event PurchaseRecorded(
        address indexed buyer,
        uint256 totalAmount,
        uint256 deploymentContribution,
        uint256 timestamp
    );
    
    event DeploymentFundReady(
        uint256 fundBalance,
        uint256 deviceCost,
        uint256 devicesDeployable
    );
    
    event DeploymentInitiated(
        uint256 indexed deploymentId,
        string region,
        string partnerOrg,
        uint256 fundedAmount,
        uint256 timestamp
    );
    
    event DeploymentConfirmed(
        uint256 indexed deploymentId,
        string partnerOrg,
        uint256 timestamp
    );
    
    event SplitRatioUpdated(
        uint256 oldRatioBps,
        uint256 newRatioBps
    );
    
    // ═══════════════════ MODIFIERS ═══════════════════
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ═══════════════════ CONSTRUCTOR ═══════════════════
    
    /// @param _deploymentSplitBps Initial split ratio in basis points (e.g., 2000 = 20%)
    /// @param _deviceDeploymentCost Cost threshold for one device deployment in tinybars
    constructor(uint256 _deploymentSplitBps, uint256 _deviceDeploymentCost) {
        require(_deploymentSplitBps <= 10000, "Split cannot exceed 100%");
        require(_deviceDeploymentCost > 0, "Device cost must be positive");
        
        owner = msg.sender;
        deploymentSplitBps = _deploymentSplitBps;
        deviceDeploymentCost = _deviceDeploymentCost;
    }
    
    // ═══════════════════ CORE FUNCTIONS ═══════════════════
    
    /// @notice Record a device purchase and split funds
    /// @dev Accepts HBAR, splits between operational and deployment fund
    function recordPurchase() external payable {
        require(msg.value > 0, "Payment required");
        
        // Calculate split
        uint256 deploymentContribution = (msg.value * deploymentSplitBps) / 10000;
        
        // Update state
        deploymentFundBalance += deploymentContribution;
        totalFundsReceived += msg.value;
        totalPurchases += 1;
        
        emit PurchaseRecorded(
            msg.sender,
            msg.value,
            deploymentContribution,
            block.timestamp
        );
        
        // Check if deployment threshold reached
        if (deploymentFundBalance >= deviceDeploymentCost) {
            uint256 deployable = deploymentFundBalance / deviceDeploymentCost;
            emit DeploymentFundReady(
                deploymentFundBalance,
                deviceDeploymentCost,
                deployable
            );
        }
        
        // TODO: Mint impact token to msg.sender via HTS precompile
        // This will be implemented with the HTS system contract integration
    }
    
    /// @notice Initiate a funded deployment to a partner organization
    /// @param _region Target deployment region
    /// @param _partnerOrg Partner organization receiving the device
    function initiateDeployment(
        string calldata _region,
        string calldata _partnerOrg
    ) external onlyOwner {
        require(deploymentFundBalance >= deviceDeploymentCost, "Insufficient deployment funds");
        
        totalDeployments += 1;
        deploymentFundBalance -= deviceDeploymentCost;
        
        deployments[totalDeployments] = Deployment({
            id: totalDeployments,
            region: _region,
            partnerOrg: _partnerOrg,
            fundedAmount: deviceDeploymentCost,
            timestamp: block.timestamp,
            confirmed: false
        });
        
        emit DeploymentInitiated(
            totalDeployments,
            _region,
            _partnerOrg,
            deviceDeploymentCost,
            block.timestamp
        );
    }
    
    /// @notice Partner organization confirms device receipt and activation
    /// @param _deploymentId The deployment to confirm
    function confirmDeployment(uint256 _deploymentId) external {
        Deployment storage d = deployments[_deploymentId];
        require(d.id > 0, "Deployment does not exist");
        require(!d.confirmed, "Already confirmed");
        
        // TODO: In production, verify msg.sender is the registered partner org
        d.confirmed = true;
        
        emit DeploymentConfirmed(
            _deploymentId,
            d.partnerOrg,
            block.timestamp
        );
    }
    
    // ═══════════════════ ADMIN FUNCTIONS ═══════════════════
    
    /// @notice Update the deployment fund split ratio
    /// @param _newSplitBps New ratio in basis points
    function updateSplitRatio(uint256 _newSplitBps) external onlyOwner {
        require(_newSplitBps <= 10000, "Split cannot exceed 100%");
        uint256 oldRatio = deploymentSplitBps;
        deploymentSplitBps = _newSplitBps;
        emit SplitRatioUpdated(oldRatio, _newSplitBps);
    }
    
    /// @notice Withdraw operational funds (non-deployment portion)
    /// @param _amount Amount to withdraw in tinybars
    /// @param _to Recipient address
    function withdrawOperational(uint256 _amount, address payable _to) external onlyOwner {
        uint256 operationalBalance = address(this).balance - deploymentFundBalance;
        require(_amount <= operationalBalance, "Exceeds operational balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    // ═══════════════════ VIEW FUNCTIONS ═══════════════════
    
    /// @notice Get the current operational (non-deployment) balance
    function getOperationalBalance() external view returns (uint256) {
        return address(this).balance - deploymentFundBalance;
    }
    
    /// @notice Get number of devices currently deployable from fund balance
    function getDeployableDevices() external view returns (uint256) {
        return deploymentFundBalance / deviceDeploymentCost;
    }
    
    /// @notice Get a deployment record
    function getDeployment(uint256 _id) external view returns (Deployment memory) {
        return deployments[_id];
    }
    
    /// @notice Get summary stats for dashboard
    function getSummary() external view returns (
        uint256 _totalPurchases,
        uint256 _totalFundsReceived,
        uint256 _deploymentFundBalance,
        uint256 _totalDeployments,
        uint256 _deployableDevices,
        uint256 _splitBps
    ) {
        return (
            totalPurchases,
            totalFundsReceived,
            deploymentFundBalance,
            totalDeployments,
            deploymentFundBalance / deviceDeploymentCost,
            deploymentSplitBps
        );
    }
    
    // Allow contract to receive HBAR
    receive() external payable {}
}
