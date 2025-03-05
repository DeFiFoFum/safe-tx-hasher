import { ethers } from "ethers";

/**
 * Result interface for decoded data operations
 */
export interface DecodedResult {
  /** Whether the decoding was successful */
  success: boolean;
  /** The decoded value (if successful) */
  value: string;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Result interface for decoded function calls
 */
export interface DecodedFunctionResult extends DecodedResult {
  /** Function signature (if identified) */
  signature?: string;
  /** Function name (if identified) */
  name?: string;
  /** Decoded parameters (if available) */
  params?: any[];
}

/**
 * Result of hex data validation
 */
export interface ValidationResult {
  /** Whether the data is valid hex */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * A utility class for decoding and validating Safe transaction data
 */
export class TransactionDataDecoder {
  /**
   * Validates if a string is properly formatted hex data
   *
   * @param data The data to validate
   * @returns Validation result
   */
  public validateHexData(data: string): ValidationResult {
    if (!data) {
      return { valid: false, error: "Data is empty" };
    }

    if (typeof data !== "string") {
      return { valid: false, error: "Data must be a string" };
    }

    // Check if it starts with 0x
    if (!data.startsWith("0x")) {
      return { valid: false, error: "Hex data must start with 0x" };
    }

    // Check if it's valid hex
    const hexRegex = /^0x[0-9a-fA-F]*$/;
    if (!hexRegex.test(data)) {
      return { valid: false, error: "Data contains invalid hex characters" };
    }

    // Check if it has even length (each byte is 2 hex chars)
    if ((data.length - 2) % 2 !== 0) {
      return { valid: false, error: "Hex data must have even length" };
    }

    return { valid: true };
  }

  /**
   * Decodes ASCII hex data by slicing off the first 32 bytes, converting to UTF-8 string,
   * trimming whitespace, and removing null characters.
   *
   * This is useful for decoding ASCII data that's been encoded in a Safe transaction.
   *
   * @param encodedData The encoded data as a hex string
   * @returns The decoded result
   *
   * @example
   * ```typescript
   * const decoder = new SafeTransactionDataDecoder();
   * const result = decoder.decodeAsciiData("0x000000000000000000000000000000000000000000000000000000000000008a30786139303539636262...");
   * if (result.success) {
   *   console.log(result.value); // "0xa9059cbb..."
   * }
   * ```
   */
  public decodeAsciiData(encodedData: string): DecodedResult {
    // Validate the input
    const validation = this.validateHexData(encodedData);
    if (!validation.valid) {
      return { success: false, value: "", error: validation.error };
    }

    // Check minimum length (needs at least 32 bytes to slice)
    if (encodedData.length < 66) {
      // 0x + 64 hex chars = 32 bytes
      return {
        success: false,
        value: "",
        error: "Data too short, minimum 32 bytes required",
      };
    }

    try {
      // Decode the data
      const decodedData = ethers
        .toUtf8String(ethers.dataSlice(encodedData, 32))
        .trim()
        .replace(/\0/g, "");

      return { success: true, value: decodedData };
    } catch (error) {
      return {
        success: false,
        value: "",
        error: `Failed to decode data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Attempts to decode a function call from transaction data
   *
   * @param encodedData The encoded function call data
   * @returns The decoded function result
   *
   * @example
   * ```typescript
   * const decoder = new SafeTransactionDataDecoder();
   * const result = decoder.decodeFunctionCall("0xa9059cbb000000000000000000000000...");
   * if (result.success) {
   *   console.log(result.name); // "transfer"
   *   console.log(result.params); // [address, amount]
   * }
   * ```
   */
  public decodeFunctionCall(encodedData: string): DecodedFunctionResult {
    // Validate the input
    const validation = this.validateHexData(encodedData);
    if (!validation.valid) {
      return { success: false, value: "", error: validation.error };
    }

    // Check minimum length (needs at least 4 bytes for function selector)
    if (encodedData.length < 10) {
      // 0x + 8 hex chars = 4 bytes
      return {
        success: false,
        value: "",
        error: "Data too short, minimum 4 bytes required for function selector",
      };
    }

    try {
      // Extract function selector (first 4 bytes)
      const functionSelector = encodedData.slice(0, 10);

      // Common ERC20 function signatures
      const knownFunctions: Record<string, { name: string; types: string[] }> =
        {
          "0xa9059cbb": { name: "transfer", types: ["address", "uint256"] },
          "0x23b872dd": {
            name: "transferFrom",
            types: ["address", "address", "uint256"],
          },
          "0x095ea7b3": { name: "approve", types: ["address", "uint256"] },
          "0x70a08231": { name: "balanceOf", types: ["address"] },
        };

      // Try to identify the function
      const knownFunction = knownFunctions[functionSelector];

      if (knownFunction) {
        // For known functions, we can try to decode the parameters
        try {
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const paramData = "0x" + encodedData.slice(10);
          const decodedParams = abiCoder.decode(knownFunction.types, paramData);

          return {
            success: true,
            value: `${knownFunction.name}(${knownFunction.types.join(",")})`,
            signature: functionSelector,
            name: knownFunction.name,
            params: decodedParams,
          };
        } catch (error) {
          // If parameter decoding fails, still return the function name
          return {
            success: true,
            value: knownFunction.name,
            signature: functionSelector,
            name: knownFunction.name,
            error: `Identified function but failed to decode parameters: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      } else {
        // For unknown functions, just return the selector
        return {
          success: true,
          value: functionSelector,
          signature: functionSelector,
        };
      }
    } catch (error) {
      return {
        success: false,
        value: "",
        error: `Failed to decode function call: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Formats decoded data for display
   *
   * @param decodedData The decoded data result
   * @returns Formatted string for display
   */
  public formatDecodedData(decodedData: DecodedResult): string {
    if (!decodedData.success) {
      return `Decoding Error: ${decodedData.error}`;
    }

    if (decodedData.value.length > 100) {
      return `${decodedData.value.substring(0, 100)}...`;
    }

    return decodedData.value;
  }
}
