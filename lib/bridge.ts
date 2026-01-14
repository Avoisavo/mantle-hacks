import { CrossChainMessenger } from "@mantleio/sdk";
import { L1_CHAIN_ID, L2_CHAIN_ID } from "./constants";
import { ethers } from "ethers";

export function publicClientToProvider(publicClient: any) {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === "fallback")
    return new ethers.providers.FallbackProvider(
      (transport.transports as any[]).map(
        ({ value }) => new ethers.providers.JsonRpcProvider(value?.url, network)
      )
    );
  return new ethers.providers.JsonRpcProvider(transport.url, network);
}

export function walletClientToSigner(walletClient: any) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export const createMessenger = (
  l1SignerOrProvider: any,
  l2SignerOrProvider: any
) => {
  return new CrossChainMessenger({
    l1ChainId: L1_CHAIN_ID,
    l2ChainId: L2_CHAIN_ID,
    l1SignerOrProvider,
    l2SignerOrProvider,
    bedrock: true,
  });
};

export const getExplorerUrl = (chainId: number, hash: string) => {
  if (chainId === L1_CHAIN_ID) {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }
  return `https://sepolia.mantle.xyz/tx/${hash}`;
};
