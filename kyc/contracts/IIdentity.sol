// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IIdentity {
    /**
     * @dev Returns true if the user has passed verification.
     * @param user The address to check.
     */
    function hasPassed(address user) external view returns (bool);
}
