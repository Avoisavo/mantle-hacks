// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITownToken {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TownDeductNative {
    ITownToken public immutable town;
    address public owner;

    event Deducted(address indexed user, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address _townToken) {
        town = ITownToken(_townToken);
        owner = msg.sender;
    }

    function deduct10() external {
        _deduct(10 * 10**18);
    }

    function deduct20() external {
        _deduct(20 * 10**18);
    }

    function _deduct(uint256 amount) internal {
        require(town.balanceOf(msg.sender) >= amount, "INSUFFICIENT_BALANCE");
        
        bool success = town.transferFrom(msg.sender, address(this), amount);
        require(success, "TRANSFER_FAILED: Check allowance");

        emit Deducted(msg.sender, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ZERO_ADDRESS");
        (bool success, ) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(success, "WITHDRAW_FAILED");
    }
}