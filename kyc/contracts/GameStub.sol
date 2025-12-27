// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IIdentity.sol";

contract GameStub {
    IIdentity public identityContract;
    mapping(address => bool) public hasEntered;

    event RoomEntered(address indexed user);

    constructor(address _identityContract) {
        identityContract = IIdentity(_identityContract);
    }

    modifier onlyVerified() {
        require(identityContract.hasPassed(msg.sender), "Identity Not Verified");
        _;
    }

    function enterRoom() external onlyVerified {
        hasEntered[msg.sender] = true;
        emit RoomEntered(msg.sender);
    }
}
