# CoinTown - 3D Monopoly Game 🎮💰

A futuristic 3D monopoly game with Web3 integration and ERC-4337 account abstraction.

## Features

- 🎨 **Futuristic Neon Theme** - Purple and pink gradient with glowing effects
- ⛓️ **Web3 Integration** - RainbowKit for wallet connections
- 🔐 **Account Abstraction** - ERC-4337 smart accounts via Google OAuth
- 🌐 **Social Login** - Google OAuth for Web2-style onboarding
- 💎 **Built on Mantle** - Mantle Sepolia testnet

## Tech Stack

- **Next.js 16** - React framework
- **Tailwind CSS v4** - Styling
- **RainbowKit + wagmi** - Web3 integration
- **NextAuth.js** - Authentication
- **Framer Motion** - Animations
- **Three.js** - 3D graphics

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

## Deployment

```bash
npm run build
npm start
```

Or deploy with Vercel:
```bash
vercel
```

## Resources

- [RainbowKit Docs](https://www.rainbowkit.com/docs)
- [ERC-4337](https://www.alchemy.com/aa)
- [Mantle Network](https://www.mantle.xyz/)

---

Built for Mantle Hacks 💜
