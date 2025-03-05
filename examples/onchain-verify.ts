import { createPublicClient, http, zeroAddress, keccak256 } from "viem";
import { linea } from "viem/chains";
import { SafeTransactionParams } from "../src/ISafeTransactionHasher";
import { ViemSafeTransactionHasher } from "../src/ViemSafeTransactionHasher";

// The Safe contract address on Linea
const SAFE_ADDRESS = "0xDb73ba19F072D0Fbc865781Ba468A9F8B77aD2C4";

// The same transaction parameters from our test
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

// Expected hashes from our test
const expectedHashes = {
  safeTxHash:
    "0x64b865a13a4d2968c6f6428a4403a2df33c35171d482322238bbac22698e6189",
  domainHash:
    "0x7ae3819992af9cb3416bfbfc483b427868cec8257ab807445212b48a5ca86dfd",
  messageHash:
    "0xd7a20bc0e18961ef47e55f868cdcd8d41a58bb689ee1837dafe8aa99a588494a",
};

// ABI for the Safe contract functions we need
const safeAbi = [
  {
    name: "getTransactionHash",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce", type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "encodeTransactionData",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce", type: "uint256" },
    ],
    outputs: [{ type: "bytes" }],
  },
  {
    name: "nonce",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function main() {
  console.log("Creating Viem client for Linea...");
  const client = createPublicClient({
    chain: linea,
    transport: http(),
  });

  console.log("Checking current nonce on Safe contract...");
  try {
    const currentNonce = await client.readContract({
      address: SAFE_ADDRESS,
      abi: safeAbi,
      functionName: "nonce",
    });

    console.log("Current nonce on contract:", currentNonce.toString());
    console.log("Nonce in our test data:  ", safeTransaction.nonce);

    console.log("\nCalling getTransactionHash on Safe contract...");
    const onchainHash = await client.readContract({
      address: SAFE_ADDRESS,
      abi: safeAbi,
      functionName: "getTransactionHash",
      args: [
        safeTransaction.to,
        safeTransaction.value,
        safeTransaction.data,
        safeTransaction.operation,
        safeTransaction.safeTxGas,
        safeTransaction.baseGas,
        safeTransaction.gasPrice,
        safeTransaction.gasToken,
        safeTransaction.refundReceiver,
        BigInt(safeTransaction.nonce),
      ],
    });

    // Try to get the encoded transaction data
    console.log("\nCalling encodeTransactionData on Safe contract...");
    const encodedData = await client.readContract({
      address: SAFE_ADDRESS,
      abi: safeAbi,
      functionName: "encodeTransactionData",
      args: [
        safeTransaction.to,
        safeTransaction.value,
        safeTransaction.data,
        safeTransaction.operation,
        safeTransaction.safeTxGas,
        safeTransaction.baseGas,
        safeTransaction.gasPrice,
        safeTransaction.gasToken,
        safeTransaction.refundReceiver,
        BigInt(safeTransaction.nonce),
      ],
    });

    console.log("\nResults:");
    console.log("On-chain hash from contract:", onchainHash);
    console.log("Expected hash from test:    ", expectedHashes.safeTxHash);
    console.log("Match?", onchainHash === expectedHashes.safeTxHash);

    console.log("\nEncoded transaction data from contract:");
    console.log(encodedData);

    // Calculate the hash of the encoded data to see if it matches
    const calculatedHashFromEncoded = keccak256(encodedData);
    console.log("\nHash of encoded data:", calculatedHashFromEncoded);
    console.log(
      "Matches on-chain hash?",
      calculatedHashFromEncoded === onchainHash
    );

    // Also compare with our implementation
    console.log("\nComparing with our implementation:");
    const hasher = new ViemSafeTransactionHasher({
      chainId: linea.id,
      verifyingContract: SAFE_ADDRESS,
    });

    const calculatedHashes = hasher.getAllHashes(safeTransaction);

    console.log("Our implementation safeTxHash:", calculatedHashes.safeTxHash);
    console.log(
      "Our implementation messageHash:",
      calculatedHashes.messageHash
    );
    console.log("Our implementation domainHash:", calculatedHashes.domainHash);

    console.log("\nMatches:");
    console.log(
      "safeTxHash:",
      calculatedHashes.safeTxHash === expectedHashes.safeTxHash
    );
    console.log(
      "messageHash:",
      calculatedHashes.messageHash === expectedHashes.messageHash
    );
    console.log(
      "domainHash:",
      calculatedHashes.domainHash === expectedHashes.domainHash
    );

    console.log(
      "\nMatches on-chain result:",
      calculatedHashes.safeTxHash === onchainHash
    );
  } catch (error) {
    console.error("Error calling contract:", error);
  }
}

main().catch(console.error);
