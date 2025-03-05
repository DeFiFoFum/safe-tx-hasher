# Safe Transaction Hasher

A CLI tool and library for generating and validating Gnosis Safe transaction hashes. This tool helps verify transaction hashes displayed on hardware wallets when signing Gnosis Safe transactions.

> ⚠️ **WARNING**: This tool currently only supports Gnosis Safe version 1.3.0

- [Safe Transaction Hasher](#safe-transaction-hasher)
  - [Installation](#installation)
  - [CLI Usage](#cli-usage)
    - [Basic Usage](#basic-usage)
    - [Options](#options)
    - [Transaction JSON Format](#transaction-json-format)
    - [Example Output](#example-output)
  - [Hardware Wallet Verification](#hardware-wallet-verification)
  - [Library Usage](#library-usage)
    - [Transaction Data Decoding](#transaction-data-decoding)
  - [Development](#development)
  - [License](#license)

## Installation

```bash
# Install globally
npm install -g safe-tx-hasher

# Or use directly with npx
npx safe-tx-hasher
```

## CLI Usage

The CLI tool allows you to generate Safe transaction hashes from a JSON file or a JSON string.

### Basic Usage

```bash
# Using a JSON file
safe-tx-hash --file transaction.json --chain-id 1 --safe-address 0x123...

# Using a JSON string
safe-tx-hash --json '{"to":"0x123...","value":"0","data":"0x...","operation":0,"nonce":1}' --chain-id 1 --safe-address 0x123...
```

### Options

- `-f, --file <path>`: Path to JSON file containing Safe transaction data
- `-j, --json <string>`: JSON string containing Safe transaction data
- `-c, --chain-id <number>`: Chain ID (default: 1)
- `-s, --safe-address <address>`: Safe contract address
- `-h, --help`: Display help information
- `-V, --version`: Display version number

### Transaction JSON Format

The transaction JSON must include the following required fields:

```json
{
  "to": "0x123...",           // Target address (required)
  "value": "0",               // ETH value in wei (optional, default: 0)
  "data": "0x...",            // Transaction data (required)
  "operation": 0,             // Operation type: 0=Call, 1=DelegateCall (required)
  "safeTxGas": "0",           // Gas for the safe transaction (optional, default: 0)
  "baseGas": "0",             // Gas costs independent of the transaction (optional, default: 0)
  "gasPrice": "0",            // Gas price (optional, default: 0)
  "gasToken": "0x0000...",    // Token address for gas payment (optional, default: zero address)
  "refundReceiver": "0x0000...", // Address for gas payment refund (optional, default: zero address)
  "nonce": 1                  // Transaction nonce (required)
}
```

### Example Output

```
⚠️  WARNING: This tool only supports Gnosis Safe version 1.3.0 ⚠️

=== Safe Transaction Hashes ===

Chain ID:       1
Safe Address:   0x123...

Transaction Details:
To:             0x123...
Value:          0
Data:           0x123...
Operation:      0
Nonce:          1

Generated Hashes (verify these on your hardware wallet):
Domain Hash:    0x123...
Message Hash:   0x123...
Safe Tx Hash:   0x123...
```

## Hardware Wallet Verification

When signing a Safe transaction on your hardware wallet, you should verify the following:

1. **Safe Tx Hash**: This is the final transaction hash that should match what's displayed on your hardware wallet.
2. **Message Hash**: Some hardware wallets may display this as an intermediate verification step.
3. **Domain Hash**: This hash represents the chain and contract being used.

Always verify that the displayed hash matches what you expect before signing a transaction.

## Library Usage

You can also use the library programmatically in your TypeScript/JavaScript projects:

```typescript
import { ViemSafeTransactionHasher } from 'safe-tx-hasher';
// Or for ethers.js users
// import { EthersSafeTransactionHasher } from 'safe-tx-hasher';

// Create domain data
const domain = {
  chainId: 1,
  verifyingContract: "0x123...", // Your Safe address
};

// Create transaction data
const safeTransaction = {
  to: "0x123...",
  value: 0n,
  data: "0x...",
  operation: 0,
  safeTxGas: 0n,
  baseGas: 0n,
  gasPrice: 0n,
  gasToken: "0x0000000000000000000000000000000000000000",
  refundReceiver: "0x0000000000000000000000000000000000000000",
  nonce: 1,
};

// Generate hashes using Viem implementation
const viemHasher = new ViemSafeTransactionHasher(domain);
const hashes = viemHasher.getAllHashes(safeTransaction);

console.log("Domain Hash:", hashes.domainHash);
console.log("Message Hash:", hashes.messageHash);
console.log("Safe Tx Hash:", hashes.safeTxHash);
```

### Transaction Data Decoding

The library also provides utilities for decoding transaction data:

```typescript
import { TransactionDataDecoder } from 'safe-tx-hasher';

// Create a decoder instance
const decoder = new TransactionDataDecoder();

// Decode ASCII data from a Safe transaction
const encodedAsciiData = "0x000000000000000000000000000000000000000000000000000000000000008a30786139303539...";
const asciiResult = decoder.decodeAsciiData(encodedAsciiData);
if (asciiResult.success) {
  console.log("Decoded ASCII data:", asciiResult.value);
}

// Decode a function call (e.g., ERC20 transfer)
const functionCallData = "0xa9059cbb0000000000000000000000008b4b268a9aa797fd60889e88ac7be9a0c4b37ff40000000000000000000000000000000000000000000000000000000511b5ac00";
const functionResult = decoder.decodeFunctionCall(functionCallData);
if (functionResult.success) {
  console.log("Function name:", functionResult.name);
  console.log("Function signature:", functionResult.signature);
  console.log("Function parameters:", functionResult.params);
}
```

The decoder supports:

- Validating hex data
- Decoding ASCII data embedded in Safe transactions
- Decoding common ERC20 function calls (transfer, transferFrom, approve, balanceOf)
- Formatting decoded data for display

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/safe-tx-hasher.git
cd safe-tx-hasher

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run the CLI locally
npm run cli -- --file transaction.json

# Run the example CLI command with sample transaction
npm run example-cli

# Run the transaction data decoder example
npm run example-decode
```

## License

ISC
