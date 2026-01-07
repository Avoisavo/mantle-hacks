# Mantle KYC Registry (Hackathon MVP)

This module implements a **Privacy-First, Gas-Optimized KYC Registry** on the Mantle Network. 
It is designed specifically to support **zkLogin (Gasless)** users while offering a standard robust flow for **MetaMask** users.

## 🚀 Key Features

1.  **Dual-Flow Verification**:
    *   **Admin Push (Gasless)**: The backend pays the gas to verify the user. Perfect for fresh zkLogin wallets with 0 MANTLE.
    *   **User Pull (Signature)**: The user pays gas to submit a backend-signed "Verify Me" pass.
2.  **No PII On-Chain**: We only store `address -> bool (isVerified)`. No names, IPs, or documents.
3.  **MVP Friendly**: Designed to work with "Mock" verification (e.g., just clicking a button in Dev Mode) or real providers (Sumsub) without code changes.

---

## 🛠 Contract Architecture

### `KYCRegistry.sol`
The core contract that acts as the gatekeeper.

*   **`signerAddress`**: The address of your backend wallet. Only this address can authorize verifications.
*   **`setApproved(address user, bool status)`**: 
    *   *Callable by:* Admin/Backend only.
    *   *Cost:* Paid by Backend.
    *   *Use Case:* **zkLogin** users who cannot pay gas yet.
*   **`verifyMe(uint256 deadline, bytes signature)`**:
    *   *Callable by:* User.
    *   *Cost:* Paid by User.
    *   *Security:* Uses EIP-712 style hash protection (User + Deadline + ChainID + ContractAddress) to prevent replay attacks.
    *   *Use Case:* Users who already have MANTLE or prefer self-custody flows.

---

## 🔄 User Flows

### Flow A: zkLogin / Gasless (Recommended)
*Ideal for onboarding web2 users who don't have crypto yet.*

1.  **User Logs in**: Uses zkLogin (Google/Apple).
2.  **User Requests KYC**: Clicks "Verify ID" on the frontend.
3.  **Backend Verification**:
    *   Server checks criteria (Mock or Real).
    *   **Server Transaction**: The backend calls `KYCRegistry.setApproved(userAddress, true)`.
4.  **Result**: User is verified on-chain without signing a generic transaction or paying gas.

### Flow B: Standard Wallet (MetaMask)
*Ideal for crypto-native users.*

1.  **User Logs in**: Connects MetaMask.
2.  **User Requests KYC**: Clicks "Verify ID".
3.  **Backend Verification**:
    *   Server checks criteria.
    *   **Server Signing**: The backend signs a message: `Sign(UserAddress + Deadline + ChainID)`.
    *   **Response**: Backend sends this `signature` back to the frontend.
4.  **User Action**: Frontend prompts user to sign the specific `verifyMe` transaction.
5.  **Result**: User pays gas, submits signature, and becomes verified.

---

## 📦 How to Deploy & Use

### 1. Setup
Ensure dependencies are installed:
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the `kyc` folder (if deploying to real testnet):
```env
PRIVATE_KEY=your_backend_wallet_private_key
MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz
```

### 3. Deploy
Deploy the registry to Mantle Sepolia:
```bash
npx hardhat run scripts/deploy.js --network mantle-sepolia
```
*   Copy the **Deployed Address** to your frontend config.
*   Ensure your backend uses the **Same Private Key** that deployed the contract (or call `setSigner` to rotate it).

### 4. Verify It Works (Test Script)
We have included a comprehensive test script that runs through both flows locally.
```bash
npx hardhat run scripts/test_kyc.js
```
*   **Success Criteria**: The script should print "SUCCESS" for both the Signature Flow and the Direct Approval Flow, and catch the Malicious Replay attempt.

---