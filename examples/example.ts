import { zeroAddress } from "viem";
import * as chains from "viem/chains";
import {
  DomainData,
  SafeTransactionParams,
} from "../src/ISafeTransactionHasher";
import { ViemSafeTransactionHasher } from "../src/ViemSafeTransactionHasher";
import { EthersSafeTransactionHasher } from "../src/EthersSafeTransactionHasher";

// Example usage:
const domain: DomainData = {
  chainId: chains.linea.id,
  verifyingContract: "0xDb73ba19F072D0Fbc865781Ba468A9F8B77aD2C4",
};

const safeTransaction: SafeTransactionParams = {
  to: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
  value: 0n,
  data: "0xa9059cbb0000000000000000000000008b4b268a9aa797fd60889e88ac7be9a0c4b37ff40000000000000000000000000000000000000000000000000000000511b5ac00",
  operation: 0,
  safeTxGas: 0n,
  baseGas: 0n,
  gasPrice: 0n,
  gasToken: zeroAddress,
  refundReceiver: zeroAddress,
  nonce: 60,
};

// Create Viem hasher instance
const viemHasher = new ViemSafeTransactionHasher(domain);

// Create Ethers hasher instance
const ethersHasher = new EthersSafeTransactionHasher(domain);

// Get all hashes using Viem
const viemHashes = viemHasher.getAllHashes(safeTransaction);

// Get all hashes using Ethers
const ethersHashes = ethersHasher.getAllHashes(safeTransaction);

// Compare the results
console.log("Viem Implementation:");
console.dir(viemHashes, { depth: null });

console.log("\nEthers Implementation:");
console.dir(ethersHashes, { depth: null });

console.log("\nDo the implementations match?");
console.log("Domain Hash:", viemHashes.domainHash === ethersHashes.domainHash);
console.log(
  "Message Hash:",
  viemHashes.messageHash === ethersHashes.messageHash
);
console.log("Safe Tx Hash:", viemHashes.safeTxHash === ethersHashes.safeTxHash);
