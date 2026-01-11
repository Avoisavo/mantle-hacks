// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ERC20 Top-up for Ethereum Sepolia:
 * Users deposit SepoliaMNT (ERC20) and receive TOWN tokens at 1:50 rate.
 *
 * - Users call approve() on SepoliaMNT first, then buyTOWN(amount)
 * - Contract transfers SepoliaMNT from user and mints TOWN
 * - Owner can withdraw collected SepoliaMNT
 */

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TownTokenERC20 {
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

contract TownTopUpERC20 {
    uint256 public constant RATE = 50; // 50 TOWN per 1 SepoliaMNT (1e18 wei)

    TownTokenERC20 public immutable town;
    IERC20 public immutable paymentToken; // SepoliaMNT
    address public owner;

    event Bought(address indexed user, uint256 mntAmount, uint256 townAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address _paymentToken) {
        require(_paymentToken != address(0), "ZERO_PAYMENT_TOKEN");
        owner = msg.sender;
        paymentToken = IERC20(_paymentToken);

        // Deploy token and set this contract as minter
        TownTokenERC20 _town = new TownTokenERC20(address(this));
        town = _town;
        _town.setMinter(address(this), true);
    }

    /**
     * @notice Buy TOWN tokens with SepoliaMNT
     * @param amount Amount of SepoliaMNT to spend (must have approved first)
     */
    function buyTOWN(uint256 amount) external {
        require(amount > 0, "ZERO_AMOUNT");

        // Transfer SepoliaMNT from user to this contract
        bool success = paymentToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "TRANSFER_FAILED");

        // Mint TOWN at 1:50 rate
        uint256 mintAmount = amount * RATE;
        town.mint(msg.sender, mintAmount);

        emit Bought(msg.sender, amount, mintAmount);
    }

    /**
     * @notice Owner can withdraw collected SepoliaMNT
     */
    function withdrawPaymentToken(
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        bool success = paymentToken.transfer(to, amount);
        require(success, "TRANSFER_FAILED");
    }

    /**
     * @notice Get contract's SepoliaMNT balance
     */
    function paymentTokenBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
