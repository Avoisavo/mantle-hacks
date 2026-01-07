The **Proof Generator** is the core of your identity verification flow. Here is a breakdown of what happens behind the scenes, followed by the UI fix for the transaction button.

### How the Proof Process Works

1. **Initial Check**: When the component loads, it queries the 
    
    ```
    KYCRegistry
    ```
    
     smart contract on **Mantle Sepolia** to see if your wallet address is already marked as 
    
    ```
    isVerified
    ```
    
    .
2. **Signing (The "Proof")**: If you aren't verified, you click "Verify Identity". You are asked to sign a specific message. This signature acts as your "Proof of Identity"—it proves you own the wallet without you having to pay any gas fees.
3. **The Relay**: Your signature is sent to a backend **Relay API** (
    
    ```
    /api/verify
    ```
    
    ). The relay acts as a bridge; it takes your signature and submits it to the smart contract using the **Relay's own gas**, so the process remains "gasless" for the user.
4. **On-Chain Approval**: The smart contract verifies the message signature and updates the mapping for your address to 
    
    ```
    true
    ```
    
    .
5. **Polling & Success**: The frontend "polls" (checks every few seconds) the smart contract. Once the contract confirms you are verified, the UI updates to the Success state.

---

### 1. It is "Sovereign" KYC

In traditional KYC, you send your passport/ID directly to a company, and they store it in their database. Here, the "Proof Generator" implies that you are using a **Self-Sovereign Identity** approach.

- **The User**: Keeps their data.
- **The App**: Only receives a signed attestation (the "Proof") that the user is real and verified.

### 2. On-Chain Verification

The smart contract (

KYCRegistry.sol) acts as the official "Gatekeeper." Once your proof is processed:

- Your wallet address is marked as 
    
    ```
    isVerified = true
    ```
    
     on the Mantle blockchain.
- Any other contract (like a Game, a DeFi pool, or an Airdrop) can now instantly check that mapping to see if you've passed the requirements.

### 3. Sybil Resistance

By requiring this process, you are essentially ensuring **Sybil Resistance**. It prevents one person from creating 1,000 bot accounts to "farm" your game or hackathon project, because each account would need a unique, verified identity proof.

### How to frame it for your hackathon:

You can describe this as **"Gasless, Privacy-Preserving KYC."**

- **Gasless**: Because the Relay pays the fee.
- **Privacy-Preserving**: Because you never see the user's ID; you only see their "Verified" status on-chain.
- **KYC**: Because it fulfills the regulatory/security requirement of knowing the user is a verified human.