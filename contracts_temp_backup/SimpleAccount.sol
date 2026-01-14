// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";

/**
 * Simple ERC-4337 Account Contract
 * Basic implementation of account abstraction
 */
contract SimpleAccount is BaseAccount {
    using ECDSA for bytes32;
    using UserOperation for UserOperation;

    address public owner;

    IEntryPoint public immutable entryPoint;

    constructor(IEntryPoint _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
    }

    // Get the entry point used by this account
    function getEntryPoint() public view override returns (IEntryPoint) {
        return entryPoint;
    }

    // Validate UserOperation signature
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
        internal
        override
        view
        returns (uint256 validationData)
    {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(userOp.signature);

        if (signer != owner) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }

    // Execute a transaction
    function execute(address dest, uint256 value, bytes calldata func)
        external
        override
        requireFromEntryPoint
    {
        _call(dest, value, func);
    }

    // Execute multiple transactions
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)
        external
        override
        requireFromEntryPoint
    {
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    // Internal call helper
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    // Get account identifier (for deposits)
    function getDeposit() public view override returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    // Receive ETH
    receive() external payable {}
}
