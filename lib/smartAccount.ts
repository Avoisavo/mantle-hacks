import { createPublicClient, createWalletClient, http, Address, Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MANTLE_SEPOLIA, SIMPLE_ACCOUNT_ABI, FACTORY_ABI, SIMPLE_ACCOUNT_FACTORY_ADDRESS } from "./mantle";

// Create public client for Mantle Sepolia
export const publicClient = createPublicClient({
  chain: MANTLE_SEPOLIA,
  transport: http(),
});

// Get deployment wallet (server-side only)
export function getDeploymentWallet() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set");
  }
  return createWalletClient({
    account: privateKeyToAccount(privateKey as Address),
    chain: MANTLE_SEPOLIA,
    transport: http(),
  });
}

// Generate deterministic address from email (for demo purposes)
export function getAddressFromEmail(email: string): Address {
  // In production, this should use proper cryptographic derivation
  // For now, we'll use keccak256 of the email
  const encoder = new TextEncoder();
  const data = encoder.encode(email);

  // Simple hash function (in production, use crypto.subtle.digest or web3.js keccak256)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to address format (0x + 40 hex chars)
  const hex = Math.abs(hash).toString(16).padStart(40, '0');
  return `0x${hex}` as Address;
}

// Get or create smart account address
export async function getSmartAccountAddress(ownerEmail: string): Promise<Address> {
  const ownerAddress = getAddressFromEmail(ownerEmail);

  // Check if account exists
  const address = await publicClient.readContract({
    address: SIMPLE_ACCOUNT_FACTORY_ADDRESS as Address,
    abi: FACTORY_ABI,
    functionName: "getAddress",
    args: [ownerAddress],
  });

  return address;
}

// Deploy smart account (called when user first interacts)
export async function deploySmartAccount(ownerEmail: string): Promise<Address> {
  const wallet = getDeploymentWallet();
  const ownerAddress = getAddressFromEmail(ownerEmail);

  // Deploy account through factory
  const hash = await wallet.writeContract({
    address: SIMPLE_ACCOUNT_FACTORY_ADDRESS as Address,
    abi: FACTORY_ABI,
    functionName: "createAccount",
    args: [ownerAddress],
  });

  // Wait for transaction
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Get account address from event or via factory
  const accountAddress = await getSmartAccountAddress(ownerEmail);

  return accountAddress;
}

// Check if account exists
export async function accountExists(address: Address): Promise<boolean> {
  const code = await publicClient.getBytecode({
    address: address as Address,
  });

  return code !== undefined && code !== "0x";
}

// Get account balance
export async function getAccountBalance(address: Address): Promise<bigint> {
  const balance = await publicClient.getBalance({
    address: address as Address,
  });

  return balance;
}

// Send transaction from smart account
export async function sendTransaction(
  from: Address,
  to: Address,
  value: bigint
): Promise<Hash> {
  const wallet = getDeploymentWallet();

  // Execute transaction through SimpleAccount
  const callData = encodeFunctionData({
    abi: SIMPLE_ACCOUNT_ABI,
    functionName: "execute",
    args: [to],
  });

  const hash = await wallet.writeContract({
    address: from,
    abi: SIMPLE_ACCOUNT_ABI,
    functionName: "execute",
    args: [to],
  });

  return hash;
}

// Helper: Encode function data
import { encodeFunctionData as viemEncodeFunctionData } from "viem";

function encodeFunctionData(params: {
  abi: readonly unknown[];
  functionName: string;
  args: unknown[];
}): Hash {
  return viemEncodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  }) as Hash;
}
