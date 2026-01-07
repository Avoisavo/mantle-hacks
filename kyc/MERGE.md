# Merging MantleID with zkLogin

This document outlines how to integrate the **MantleID (KYC Registry)** protocol with a **zkLogin** implementation. This is particularly useful for onboarding "gasless" users who sign in via Google/Apple/Twitch and may not have ETH/MNT to pay for verification transactions.

---

## 1. Architectural Overview

The integration works by using the **Admin/Relay Flow** already built into the `KYCRegistry.sol` contract.

1.  **Identity Provider**: User logs in via zkLogin (OAuth).
2.  **Wallet Generation**: zkLogin generates a deterministic Mantle address for the user.
3.  **Backend Verification**: Your backend verifies the user's social identity or ZK-Proof.
4.  **Gasless Approval**: Your backend calls the `setApproved` function on the smart contract from the Relay wallet.

---

## 2. Smart Contract Integration

The `KYCRegistry.sol` contract has a built-in function specifically for this scenario:

```solidity
/**
 * @dev Admin/Backend directly sets status.
 * Use this for zkLogin users who might not have gas to transact.
 */
function setApproved(address user, bool status) external onlyOwner {
    isVerified[user] = status;
    if (status) emit KYCVerified(user);
    else emit KYCRevoked(user);
}
```

### Key Differences:
- **Standard Flow**: User signs a message and a relay submits it (Self-Service).
- **zkLogin Flow**: The system automatically approves the user after a successful social login (Automated).

---

## 3. Implementation Steps

### Step A: Backend Webhook
When the zkLogin flow completes, your backend receives a "Login Success" message along with the user's `walletAddress`.

### Step B: Relay Submission
Use the existing Relay logic (found in `app/api/verify/route.ts`) to submit the approval. Instead of verifying a signature, you verify the OAuth token from the zkLogin provider.

```javascript
// Pseudocode for your Backend/API
async function handleZkLoginSuccess(userAddress) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(RELAY_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(KYC_ADDRESS, KYC_ABI, wallet);

  // Directly approve the user
  const tx = await contract.setApproved(userAddress, true);
  return tx.hash;
}
```

---

## 4. Frontend UX Merge

In your `IdentitySignUp` component, add a new step or a conditional branch for zkLogin:

1.  **Selection**: User chooses "Login with Google" (zkLogin).
2.  **Processing**: Show the "Verifying..." animation from `ProofGenerator.tsx`.
3.  **Automatic Completion**: Since the backend handles the gas and the transaction, the frontend simply polls `isVerified(userAddress)` until it returns `true`.
4.  **Success**: Trigger the `SuccessState.tsx` component.

---

## 5. Benefits of Merging
*   **Zero Barrier to Entry**: Users don't need a wallet extension (zkLogin) and they don't need gas (MantleID Relay).
*   **Unified Compliance**: Whether a user uses MetaMask or zkLogin, they are stored in the same `KYCRegistry` contract, making it easy for game contracts to verify them.
