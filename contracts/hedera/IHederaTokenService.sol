// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.20 <0.9.0;

/// @title Minimal HTS Precompile Interface
/// @notice Subset of Hedera Token Service system contract at address 0x167.
///         Only includes functions needed for Prometheus Impact Token minting.
/// @dev Full interface: https://github.com/hashgraph/hedera-smart-contracts
interface IHederaTokenService {

    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType;   // false = INFINITE, true = FINITE
        int64 maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }

    struct TokenKey {
        /// @dev Bit field: 1=ADMIN, 2=KYC, 4=FREEZE, 8=WIPE, 16=SUPPLY, 32=FEE, 64=PAUSE
        uint keyType;
        KeyValue key;
    }

    struct KeyValue {
        bool inheritAccountKey;
        address contractId;
        bytes ed25519;
        bytes ECDSA_secp256k1;
        address delegatableContractId;
    }

    struct Expiry {
        int64 second;
        address autoRenewAccount;
        int64 autoRenewPeriod;
    }

    /// @notice Create a fungible token via HTS precompile
    function createFungibleToken(
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) external payable returns (int64 responseCode, address tokenAddress);

    /// @notice Mint additional supply of a fungible token
    function mintToken(
        address token,
        int64 amount,
        bytes[] memory metadata
    ) external returns (int64 responseCode, int64 newTotalSupply, int64[] memory serialNumbers);

    /// @notice Transfer fungible tokens between accounts
    function transferToken(
        address token,
        address sender,
        address receiver,
        int64 amount
    ) external returns (int64 responseCode);
}
