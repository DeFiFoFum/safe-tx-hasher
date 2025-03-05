#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import path from "path";
import { zeroAddress } from "viem";
import { ViemSafeTransactionHasher } from "../src/ViemSafeTransactionHasher";
import {
  DomainData,
  SafeTransactionParams,
} from "../src/ISafeTransactionHasher";

// Display a warning about Safe version compatibility
console.warn(
  "\n⚠️  WARNING: This tool only supports Gnosis Safe version 1.3.0 ⚠️\n"
);

const program = new Command();

program
  .name("safe-tx-hash")
  .description(
    "CLI tool to generate and validate Gnosis Safe transaction hashes"
  )
  .version("1.0.0");

program
  .option(
    "-f, --file <path>",
    "Path to JSON file containing Safe transaction data"
  )
  .option("-j, --json <string>", "JSON string containing Safe transaction data")
  .option("-c, --chain-id <number>", "Chain ID", "1")
  .option("-s, --safe-address <address>", "Safe contract address", "");

program.parse(process.argv);

const options = program.opts();

// Validate that either file or json option is provided
if (!options.file && !options.json) {
  console.error("Error: Either --file or --json option is required");
  program.help();
  process.exit(1);
}

// Function to parse and validate transaction data
function parseTransactionData(jsonData: string): SafeTransactionParams {
  try {
    const data = JSON.parse(jsonData);

    // Validate required fields
    const requiredFields = ["to", "data", "operation", "nonce"];
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Convert values to appropriate types
    const tx: SafeTransactionParams = {
      to: data.to,
      value: BigInt(data.value || 0),
      data: data.data,
      operation: Number(data.operation) as 0 | 1,
      safeTxGas: BigInt(data.safeTxGas || 0),
      baseGas: BigInt(data.baseGas || 0),
      gasPrice: BigInt(data.gasPrice || 0),
      gasToken: data.gasToken || zeroAddress,
      refundReceiver: data.refundReceiver || zeroAddress,
      nonce: Number(data.nonce),
    };

    return tx;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing transaction data: ${error.message}`);
    } else {
      console.error("Unknown error parsing transaction data");
    }
    process.exit(1);
  }
}

// Get transaction data from file or JSON string
let transactionData: SafeTransactionParams;
if (options.file) {
  try {
    const filePath = path.resolve(options.file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    transactionData = parseTransactionData(fileContent);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading file: ${error.message}`);
    } else {
      console.error("Unknown error reading file");
    }
    process.exit(1);
  }
} else {
  transactionData = parseTransactionData(options.json);
}

// Validate Safe address
if (!options.safeAddress) {
  console.warn("Warning: No Safe address provided. Using default domain data.");
}

// Create domain data
const domainData: DomainData = {
  chainId: Number(options.chainId),
  verifyingContract: options.safeAddress || zeroAddress,
};

// Generate hashes
const hasher = new ViemSafeTransactionHasher(domainData);
const hashes = hasher.getAllHashes(transactionData);

// Display results
console.log("\n=== Safe Transaction Hashes ===\n");
console.log(`Chain ID:       ${domainData.chainId}`);
console.log(`Safe Address:   ${domainData.verifyingContract}`);
console.log(`\nTransaction Details:`);
console.log(`To:             ${transactionData.to}`);
console.log(`Value:          ${transactionData.value.toString()}`);
console.log(
  `Data:           ${
    transactionData.data.length > 66
      ? `${transactionData.data.substring(0, 66)}...`
      : transactionData.data
  }`
);
console.log(`Operation:      ${transactionData.operation}`);
console.log(`Nonce:          ${transactionData.nonce}`);

console.log(`\nGenerated Hashes (verify these on your hardware wallet):`);
console.log(`Domain Hash:    ${hashes.domainHash}`);
console.log(`Message Hash:   ${hashes.messageHash}`);
console.log(`Safe Tx Hash:   ${hashes.safeTxHash}`);
console.log("\n");
