// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IIdentity.sol";

contract MockIdentity is IIdentity {
    mapping(address => bool) public isVerified;

    event Verified(address indexed user);

    /**
     * @dev Simulates the verification process. 
     * In a real system, only a relayer would call this.
     * Here, anyone can verify themselves for testing.
     */
    function verifyMe() external {
        isVerified[msg.sender] = true;
        emit Verified(msg.sender);
    }

    /**
     * @dev Interface implementation.
     */
    function hasPassed(address user) external view override returns (bool) {
        return isVerified[user];
    }
}
