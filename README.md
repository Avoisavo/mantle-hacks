# CoinTown - 3D Monopoly Game 🎮💰

This project is a consumer-facing GameFi application. It turns Real World Asset (RWA) ownership and yield into a Monopoly-style game that built on the Mantle Network. Instead of understanding complex RealFi dashboards and financial terms,this platform presents RWA concepts through familiar actions. For example, buying properties, collecting rent, upgrading assets and competing with other players. Each in-game property represents a tokenized or RWA-backed asset. Meanwhile, rent or rewards reflect real world cash flow logic in a simplified, understandable way. 
The goal is to make RWA feel less intimidating and less boring. Instead of facing smart contracts and complex interfaces, users are invited to play. Over time, they naturally learn how ownership, yield and asset growth work without needing prior DeFi knowledge. 
Mantle is used because it supports low-cost, fast transactions which are essential for frequent game actions such as trades, rent payouts and upgrades. These interactions would be frustrating or too expensive on high-fee networks, but work smoothly on Mantle. 
Overall, the project explores how gamification can act as a practical entry point into RealFi, making real-world asset concepts more approachable and engaging.


 ## Problem Statement
  1. Loss of Purpose After Tokenization: Many Real-World Assets (RWAs) and NFTs are treated as the end product rather than the starting point.
     Once tokenized and issued on-chain, assets often stop evolving.
     
  2. Assets Become Static: After minting, most RWAs and NFTs remain unchanged, offering no interaction, progression or dynamic behavior. As a result, assets that sit passively in wallets or           marketplaces without reflecting real-world activity or ongoing value creation.

  3. Utility Limited to Trading or Lending: In most cases, RWAs and NFTs are only useful for buying and selling , speculation, collateral for loans .There is little to no functional,                 experiential or composable utility which limiting their long-term value.
     
  4. Rapid Decline in User Engagement: After the initial excitement of minting fades, users are given no reason to return. Without ongoing interaction or incentives, communities lose momentum        and attention quietly disappears.

## Solution
 1. Interactive Asset Activation: Cointown transforms tokenized assets into interactive NFTs inside a Monopoly-style game world. Instead of remaining idle after issuance, each asset becomes an      active, playable component of a living on-chain economy.

 2. Active Ownership Over Passive Holding: Ownership NFTs evolve beyond static collectibles by being actively used in gameplay, embedded into core mechanics and designed for repeated                interaction. This turns ownership into participation rather than mere storage.

 3. Rent Generation & Shared Economy : When other players land on owned assets, NFTs generate rent and rewards. This enables continuous yield from ownership.
    
### Architectural flow

The CoinTown application follows a three-tier architecture pattern, flowing from the user interface layer down through the API layer to the blockchain layer.

**Frontend Layer (Next.js Application)**
The frontend is built as a Next.js application that serves as the primary user interface. It consists of three main sub-layers: Pages, Components, and Hooks. Pages handle routing and page-level logic, Components contain reusable UI elements and business logic, and Hooks manage state and side effects. The frontend communicates with external services like Google OAuth and WalletConnect for authentication, and connects to the API layer for backend operations.

**API Layer (Next.js API Routes)**
The API layer acts as an intermediary between the frontend and blockchain. It contains three primary service modules: Account Management handles smart account creation and queries, Auth/KYC Verification processes identity verification requests and signatures, and Game Server manages multiplayer game state synchronization via WebSocket connections. The API layer receives requests from the frontend, processes them, and interacts with the blockchain layer on behalf of users.

**Blockchain Layer (Mantle Sepolia)**
The blockchain layer consists of multiple smart contracts deployed on Mantle Sepolia testnet. The Smart Account Factory creates ERC-4337 smart accounts using deterministic address generation. The KYC Registry stores identity verification status for users. Town Token Contracts handle the game's token economy, including top-up and deduct operations. NFT Contracts manage the real-world asset NFTs that players can own in the game. All contract interactions flow through the API layer, which signs transactions using server-side wallets or user signatures.

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **3D Graphics**: Three.js 0.155.0, React Three Fiber, React Three Drei
- **Physics**: Cannon.js (cannon-es)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Web3 Integration
- **Wallet Connection**: RainbowKit 2.2.10
- **Ethereum Library**: wagmi 3.2.0, viem 2.43.5
- **Account Abstraction**: Alchemy AA SDK (@alchemy/aa-accounts, @alchemy/aa-core)
- **Bridge**: Mantle SDK (@mantleio/sdk)


### Backend & Infrastructure
- **API**: Next.js API Routes
- **Real-time**: WebSocket Server (Node.js + ws)
- **State Management**: TanStack Query (React Query)
- **Environment**: Node.js with TypeScript

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat 3.1.2
- **Libraries**: OpenZeppelin Contracts 5.4.0
- **Standards**: ERC-4337, ERC-721 (NFTs), ERC-20 (Tokens)

### Networks
- **L1**: Ethereum Sepolia (Chain ID: 11155111)
- **L2**: Mantle Sepolia Testnet (Chain ID: 5003)


## Deployment Guide
Quick reference for deploying CoinTown contracts to Mantle Sepolia.

## Prerequisites

- Node.js v18+
- Testnet MNT from [Mantle Faucet](https://faucet.mantle.xyz/)
- `.env.local` configured with `DEPLOYER_PRIVATE_KEY`

## Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Compile contracts
npx hardhat compile
```

## Deploy Contracts

### Smart Account Factory (ERC-4337)

```bash
npx hardhat run scripts/deploy.js --network mantleSepolia
```

Update `.env.local`:
```env
NEXT_PUBLIC_FACTORY_ADDRESS=<deployed_address>
```

### KYC Registry

```bash
npx ts-node scripts/deploy-kyc.ts
```

Update `.env.local`:
```env
NEXT_PUBLIC_KYC_REGISTRY_ADDRESS=<deployed_address>
KYC_SIGNER_ADDRESS=<relay_wallet_address>
```

### Town Token Contracts

```bash
# Deploy TopUp contract
npx ts-node scripts/deploy-town-native.ts

# Deploy Deduct contract
npx ts-node scripts/deploy-town-deduct.ts
```

Update `utils/address.ts` with deployed addresses.

### NFT Contracts

```bash
# Deploy basic NFT
npx ts-node scripts/deploy-nft-mantle.ts

# Deploy 32 RWA assets
npx ts-node scripts/deploy-32-rwa.ts
```

## Verify Deployment

Check contract on [Mantle Explorer](https://sepolia.mantlescan.xyz/):

```bash
curl https://rpc.sepolia.mantle.xyz \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["<address>","latest"],"id":1}'
```

## Network Info

- **Chain ID:** 5003
- **RPC:** https://rpc.sepolia.mantle.xyz
- **Explorer:** https://sepolia.mantlescan.xyz
- **Faucet:** https://faucet.mantle.xyz/

## Troubleshooting

- **No MNT:** Get from [faucet](https://faucet.mantle.xyz/)
- **Artifact not found:** Run `npx hardhat compile`
- **Nonce errors:** Wait for pending transactions to confirm

# Contract Addresses

## Smart Account Contracts
- **SimpleAccountFactory**: `0x7c4d0215d5DffDab6c439075B48a1636754c8b26`

## Identity & KYC
- **KYC Registry**: `0x22F3Cd2Cf4C38453939f04a02fF6b15Aa237ef86`

## Token Contracts
- **TOWN Token**: `0xF682C00965fA8Fe475cEE15cD9Ec514abD71DD49`
- **TownTopUpNative**: `0x2e99559aE2d30dF514559C883Cfb9997f82a39bf`
- **TownDeductNative**: `0x9acb9dD1573c2889906e0B3DF66ee24Cd4a2168C`

## NFT Contracts
- **MyNFT**: `0x3B73Aa8c41e814424EE9f557D25282e1c7FCa23F`

## Token Addresses
- **MNT Token (Mantle Sepolia)**: `0x35578E7e8949B5a59d40704dCF6D6faEC2Fb1D17`
- **MNT Token (L1 Sepolia)**: `0x65e37b558f64e2be5768db46df22f93d85741a9e`
- **Native MNT (L2)**: `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000`

## Chain IDs
- **Ethereum Sepolia (L1)**: `11155111`
- **Mantle Sepolia (L2)**: `5003`






