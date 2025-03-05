import { TransactionDataDecoder } from "../src/utils/TransactionDataDecoder";

/**
 * This example demonstrates how to use the TransactionDataDecoder utility
 * to decode and analyze Safe transaction data.
 */

// Create a decoder instance
const decoder = new TransactionDataDecoder();

// Example 1: Decode an ERC20 transfer function call
console.log("\n=== Example 1: Decode ERC20 Transfer Function ===");
const transferData =
  "0xa9059cbb0000000000000000000000008b4b268a9aa797fd60889e88ac7be9a0c4b37ff40000000000000000000000000000000000000000000000000000000511b5ac00";

const transferResult = decoder.decodeFunctionCall(transferData);
if (transferResult.success) {
  console.log(`Function signature: ${transferResult.signature}`);
  console.log(`Function name: ${transferResult.name}`);
  console.log("Parameters:");
  console.log(`  Recipient: ${transferResult.params?.[0]}`);
  console.log(`  Amount: ${transferResult.params?.[1].toString()}`);
} else {
  console.log(`Decoding failed: ${transferResult.error}`);
}

// Example 2: Decode ASCII data from a Safe transaction
console.log("\n=== Example 2: Decode ASCII Data from Safe Transaction ===");
const asciiData =
  "0x000000000000000000000000000000000000000000000000000000000000008a30786139303539636262303030303030303030303030303030303030303030303030386234623236386139616137393766643630383839653838616337626539613063346233376666343030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303035313162356163303000000000000000000000000000000000000000000000";

const asciiResult = decoder.decodeAsciiData(asciiData);
if (asciiResult.success) {
  console.log("Decoded ASCII data:");
  console.log(asciiResult.value);

  // We can further decode the extracted data as a function call
  console.log("\nDecoding the extracted data as a function call:");
  const extractedFunctionResult = decoder.decodeFunctionCall(asciiResult.value);
  if (extractedFunctionResult.success) {
    console.log(`Function: ${extractedFunctionResult.name || "Unknown"}`);
    if (extractedFunctionResult.params) {
      console.log("Parameters:");
      extractedFunctionResult.params.forEach((param, index) => {
        console.log(`  [${index}]: ${param.toString()}`);
      });
    }
  }
} else {
  console.log(`Decoding failed: ${asciiResult.error}`);
}

// Example 3: Handle unknown function signature
console.log("\n=== Example 3: Handle Unknown Function Signature ===");
const unknownFunction =
  "0xabcdef120000000000000000000000000000000000000000000000000000000000000001";

const unknownResult = decoder.decodeFunctionCall(unknownFunction);
if (unknownResult.success) {
  console.log(`Function signature: ${unknownResult.signature}`);
  if (unknownResult.name) {
    console.log(`Function name: ${unknownResult.name}`);
  } else {
    console.log("Function name: Unknown function");
    console.log("To handle unknown functions, you could:");
    console.log("1. Add the signature to the known functions list");
    console.log("2. Use a more comprehensive ABI database");
    console.log("3. Manually decode the parameters based on expected types");
  }
} else {
  console.log(`Decoding failed: ${unknownResult.error}`);
}

// Example 4: Validate hex data
console.log("\n=== Example 4: Validate Hex Data ===");
const validHex = "0x1234abcd";
const invalidHex = "0x123xyz";
const oddLengthHex = "0x123";

console.log(
  `Valid hex (${validHex}): ${decoder.validateHexData(validHex).valid}`
);
console.log(
  `Invalid hex (${invalidHex}): ${decoder.validateHexData(invalidHex).valid}`
);
const oddResult = decoder.validateHexData(oddLengthHex);
console.log(
  `Odd length hex (${oddLengthHex}): ${oddResult.valid} - ${oddResult.error}`
);

// Example 5: Format decoded data for display
console.log("\n=== Example 5: Format Decoded Data ===");
const successData = { success: true, value: "This is a successful result" };
const errorData = {
  success: false,
  value: "",
  error: "This is an error message",
};
const longData = { success: true, value: "a".repeat(200) };

console.log(`Formatted success: ${decoder.formatDecodedData(successData)}`);
console.log(`Formatted error: ${decoder.formatDecodedData(errorData)}`);
console.log(`Formatted long data: ${decoder.formatDecodedData(longData)}`);

console.log("\n=== Usage Tips ===");
console.log(
  "1. Use decodeAsciiData() for ASCII data embedded in Safe transactions"
);
console.log("2. Use decodeFunctionCall() for direct function call data");
console.log("3. Always check the 'success' property before using the result");
console.log(
  "4. For unknown functions, you can still access the function signature"
);
console.log(
  "5. Use formatDecodedData() to get a display-friendly version of the result"
);
