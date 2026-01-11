// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simple fixed-rate top-up:
 * 1 native token (Mantle Sepolia / "Sepolia Mantle") -> 50 TOWN
 *
 * - Users send native token to the converter (buyTOWN / receive()).
 * - Contract mints TOWN to the sender at a fixed rate.
 * - Owner can withdraw collected native token.
 *
 */

contract TownToken {
    // -- ERC20 minimal ---
    string public name = "Town Token";
    string public symbol = "TOWN";
    uint8 public decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    mapping(address => bool) public isMinter;

    // ERC20 Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyMinter() {
        require(isMinter[msg.sender], "NOT_MINTER");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        isMinter[minter] = allowed;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    // allow 500town to buy houses
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyMinter {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    //move town token from A to B
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ZERO_TO");
        uint256 bal = balanceOf[from];
        require(bal >= value, "BALANCE");
        balanceOf[from] = bal - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}

contract TownTopUp {
    uint256 public constant RATE = 50; // 50 TOWN per 1 native token (1e18 wei)

    TownToken public immutable town;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;

        // Deploy token and set this contract as minter
        TownToken _town = new TownToken(address(this));
        town = _town;
        _town.setMinter(address(this), true);
    }

    function buyTOWN() external payable {
        _buy(msg.sender, msg.value);
    }

    receive() external payable {
        _buy(msg.sender, msg.value);
    }

    function _buy(address user, uint256 amountWei) internal {
        require(amountWei > 0, "ZERO_VALUE");

        // 1e18 wei * 50 => 50e18 (i.e., 50 tokens with 18 decimals)
        uint256 mintAmount = amountWei * RATE;

        town.mint(user, mintAmount);
    }
}
