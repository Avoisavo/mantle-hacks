// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IIdentity.sol";
/**
 * @title KYCRegistry
 * @dev Manages KYC status on-chain.
 * Supports two flows:
 * 1. Admin Verification: Admin calls setApproved(user, true). Good for gasless users (zkLogin).
 * 2. Signature Verification: User calls verifyMe() with a signature from the Admin. Good for self-service.
 */
contract KYCRegistry is IIdentity, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // The address of your backend/admin wallet that signs attestations
    address public signerAddress;

    // Mapping: User Address -> Is Verified?
    mapping(address => bool) public isVerified;

    event KYCVerified(address indexed user);
    event KYCRevoked(address indexed user);
    event SignerUpdated(address indexed newSigner);

    constructor(address _signer) Ownable(msg.sender) {
        signerAddress = _signer;
    }

    /**
     * @dev Updates the signer address.
     */
    function setSigner(address _signer) external onlyOwner {
        signerAddress = _signer;
        emit SignerUpdated(_signer);
    }

    /**
     * @dev Admin/Backend directly sets status.
     * Use this for zkLogin users who might not have gas to transact.
     */
    function setApproved(address user, bool status) external onlyOwner {
        isVerified[user] = status;
        if (status) emit KYCVerified(user);
        else emit KYCRevoked(user);
    }

    /**
     * @dev User self-verifies using a signed message from the backend.
     * @param deadline Unix timestamp until which this signature is valid.
     * @param signature The signature provided by the backend.
     */
    function verifyMe(uint256 deadline, bytes calldata signature) external {
        require(block.timestamp <= deadline, "Signature expired");
        // We allow re-verification to extend sessions if we added expiry later,
        // but for now check if already verified to save gas?
        // No, let them re-verify if they want.

        // Anti-replay: Includes chainId and contract address
        bytes32 hash = keccak256(
            abi.encodePacked(msg.sender, deadline, block.chainid, address(this))
        );
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();

        address recovered = ethSignedHash.recover(signature);
        require(recovered == signerAddress, "Invalid Signature");

        isVerified[msg.sender] = true;
        emit KYCVerified(msg.sender);
    }

    /**
     * @dev Allows anyone to self-verify without admin approval or signatures.
     * Similar to TownTopUpNative's open buyTOWN function - everyone can access.
     */
    function selfVerify() external {
        require(!isVerified[msg.sender], "Already verified");

        isVerified[msg.sender] = true;
        emit KYCVerified(msg.sender);
    }

    /**
     * @dev Interface implementation.
     */
    function hasPassed(address user) external view override returns (bool) {
        return isVerified[user];
    }
}
