// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Native MNT Top-up for Mantle Sepolia:
 * Users send native MNT and receive TOWN tokens at 1:50 rate.
 *
 * - Users call buyTOWN() with MNT value
 * - Contract mints TOWN tokens
 * - Owner can withdraw collected MNT
 */

contract TownTokenNative {
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

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "ALLOWANCE");
        allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyMinter {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ZERO_TO");
        uint256 bal = balanceOf[from];
        require(bal >= value, "BALANCE");
        balanceOf[from] = bal - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}

contract TownTopUpNative {
    uint256 public constant RATE = 50; // 50 TOWN per 1 MNT

    TownTokenNative public immutable town;
    address public owner;

    event Bought(address indexed user, uint256 mntAmount, uint256 townAmount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;

        // Deploy token and set this contract as minter
        TownTokenNative _town = new TownTokenNative(address(this));
        town = _town;
        _town.setMinter(address(this), true);
    }

    /**
     * @notice Buy TOWN tokens with native MNT
     * Send MNT with this transaction
     */
    function buyTOWN() external payable {
        require(msg.value > 0, "ZERO_AMOUNT");

        // Mint TOWN at 1:50 rate
        uint256 mintAmount = msg.value * RATE;
        town.mint(msg.sender, mintAmount);

        emit Bought(msg.sender, msg.value, mintAmount);
    }

    /**
     * @notice Owner can withdraw collected MNT
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        require(address(this).balance >= amount, "INSUFFICIENT_BALANCE");

        (bool success, ) = to.call{value: amount}("");
        require(success, "TRANSFER_FAILED");

        emit Withdrawn(to, amount);
    }

    /**
     * @notice Get contract's MNT balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Receive function to accept MNT
     */
    receive() external payable {}
}
