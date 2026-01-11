// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleAccount.sol";

/**
 * Factory for creating SimpleAccount contracts
 * Uses CREATE2 for deterministic address generation
 */
contract SimpleAccountFactory {
    IEntryPoint public immutable entryPoint;

    // Track account addresses per owner
    mapping(address => address) public accountAddress;

    event AccountCreated(address indexed account, address indexed owner);

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
    }

    /**
     * Get the counterfactual address for an owner
     * @param owner The owner address
     * @return predicted The predicted address
     */
    function getAddress(address owner) public view returns (address predicted) {
        bytes32 salt = bytes32(uint256(uint160(owner)));
        bytes memory bytecode = getTypeHash();

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * Create a new account for an owner
     * @param owner The owner address
     * @return ret The address of the created account
     */
    function createAccount(address owner) public returns (address ret) {
        address accountAddress = getAddress(owner);

        // Check if account already exists
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(accountAddress)
        }
        if (codeSize > 0) {
            return accountAddress;
        }

        // Deploy account
        bytes32 salt = bytes32(uint256(uint160(owner)));
        SimpleAccount account = new SimpleAccount{salt: salt}(entryPoint, owner);

        emit AccountCreated(address(account), owner);
        return address(account);
    }

    /**
     * Get the bytecode hash for CREATE2
     */
    function getTypeHash() public pure returns (bytes memory) {
        return type(SimpleAccount).creationCode;
    }
}
