# CoinTown - 3D Monopoly Game 🎮💰

A futuristic 3D monopoly game with Web3 integration and ERC-4337 account abstraction.


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

### Authentication
- **Social Login**: NextAuth.js 4.24.13
- **OAuth Provider**: Google OAuth 2.0
- **Session Management**: JWT-based sessions

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







## Quick Start

1. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

2. **Set up environment variables**

Create `.env.local`:
```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
NEXT_PUBLIC_FACTORY_ADDRESS=0x7c4d0215d5DffDab6c439075B48a1636754c8b26
```

Get credentials from:
- WalletConnect: https://cloud.walletconnect.com/
- Google OAuth: https://console.cloud.google.com/

3. **Run development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
mantle-hacks/
├── components/          # React components
├── contracts/           # Smart contracts (SimpleAccount, Factory)
├── lib/                 # Utilities (wagmi, mantle config)
├── pages/               # Next.js pages & API routes
└── scripts/             # Deployment & verification scripts
```

## Authentication

**Google Login (Web2)** → Creates ERC-4337 smart account
**Wallet Connect (Web3)** → Direct wallet connection

## Deployment Guide




