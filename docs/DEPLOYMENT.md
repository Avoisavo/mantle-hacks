# Smart Contract Deployment Guide for CoinTown

## Overview

This guide explains how to deploy the ERC-4337 smart contracts (SimpleAccount and SimpleAccountFactory) to Mantle Sepolia.

## Prerequisites

1. Node.js installed
2. Testnet MNT in your deployer wallet
3. DEPLOYER_PRIVATE_KEY in your `.env.local`

## Option 1: Use Your Existing Factory Address

You already have a factory address configured:
```
NEXT_PUBLIC_FACTORY_ADDRESS=0x7c4d0215d5DffDab6c439075B48a1636754c8b26
```

### Verify the Contract

Check if it's deployed:
```bash
curl https://rpc.sepolia.mantle.xyz \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": ["0x7c4d0215d5DffDab6c439075B48a1636754c8b26", "latest"],
    "id": 1
  }'
```

If it returns bytecode (not "0x"), the contract is deployed!

View on explorer: https://sepolia.mantle.xyz/address/0x7c4d0215d5DffDab6c439075B48a1636754c8b26

## Option 2: Deploy New Contracts

### Using Foundry (Recommended - Fastest)

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Initialize Foundry project (if needed):
```bash
cd contracts
forge init --force
```

3. Copy contract files to `src/`

4. Deploy:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

### Using Hardhat

1. Install dependencies (already done):
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers@6
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network mantleSepolia
```

### Using Remix IDE (Simplest for Testing)

1. Go to https://remix.ethereum.org/
2. Create new file `SimpleAccount.sol`
3. Copy contract code from `/contracts/SimpleAccount.sol`
4. Copy contract code from `/contracts/SimpleAccountFactory.sol`
5. Compile & Deploy
6. Select "Mantle Sepolia" network
7. Deploy with your private key

## Contract Files

We have two main contracts:

### 1. SimpleAccount.sol
ERC-4337 smart account that:
- Validates user signatures
- Executes transactions
- Supports batch operations

### 2. SimpleAccountFactory.sol
Factory contract that:
- Creates SimpleAccount instances
- Uses CREATE2 for deterministic addresses
- Predicts account addresses before deployment

## Your Current Setup

✅ Google OAuth configured
✅ Deployer wallet: `0x436bb42c65c4e72df86b40b198e663963e17a573afd290957e2fed92a4650a31`
✅ Factory address: `0x7c4d0215d5DffDab6c439075B48a1636754c8b26`

## Next Steps

1. **Verify your factory has MNT** (for gas):
   - Check balance on explorer
   - Get MNT from: https://faucet.mantle.xyz/

2. **Test the setup**:
   ```bash
   npm run dev
   ```

3. **Try logging in** with Google OAuth

4. **Check if smart account is created**:
   - Go to `/api/account/create`
   - Post with email

## Deployment Checklist

- [ ] Deployer wallet has testnet MNT
- [ ] Factory contract deployed
- [ ] NEXT_PUBLIC_FACTORY_ADDRESS set in .env.local
- [ ] Contracts verified on explorer (optional)
- [ ] Test account creation

## Need Help?

If your factory address doesn't have bytecode, you need to deploy contracts:

**Quick Start with Remix:**
1. Open https://remix.ethereum.org/
2. Paste contracts from `/contracts/` folder
3. Connect wallet with your DEPLOYER_PRIVATE_KEY
4. Deploy to Mantle Sepolia
5. Copy factory address to `.env.local`

This takes ~5 minutes!
