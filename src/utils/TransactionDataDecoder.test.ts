import { TransactionDataDecoder } from "./TransactionDataDecoder";

describe("TransactionDataDecoder", () => {
  let decoder: TransactionDataDecoder;

  beforeEach(() => {
    decoder = new TransactionDataDecoder();
  });

  describe("validateHexData", () => {
    it("should validate correct hex data", () => {
      const result = decoder.validateHexData("0x1234abcd");
      expect(result.valid).toBe(true);
    });

    it("should reject data without 0x prefix", () => {
      const result = decoder.validateHexData("1234abcd");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must start with 0x");
    });

    it("should reject data with invalid hex characters", () => {
      const result = decoder.validateHexData("0x1234abcdxyz");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("invalid hex characters");
    });

    it("should reject data with odd length", () => {
      const result = decoder.validateHexData("0x123");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("even length");
    });

    it("should reject empty data", () => {
      const result = decoder.validateHexData("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });
  });

  describe("decodeAsciiData", () => {
    it("should decode ASCII data from hex", () => {
      // This is an example of encoded data from a Safe transaction
      const encodedData =
        "0x000000000000000000000000000000000000000000000000000000000000008a30786139303539636262303030303030303030303030303030303030303030303030386234623236386139616137393766643630383839653838616337626539613063346233376666343030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303035313162356163303000000000000000000000000000000000000000000000";

      const result = decoder.decodeAsciiData(encodedData);

      expect(result.success).toBe(true);
      expect(result.value).toBe(
        "0xa9059cbb0000000000000000000000008b4b268a9aa797fd60889e88ac7be9a0c4b37ff40000000000000000000000000000000000000000000000000000000511b5ac00"
      );
    });

    it("should handle data that's too short", () => {
      const result = decoder.decodeAsciiData("0x1234");
      expect(result.success).toBe(false);
      expect(result.error).toContain("too short");
    });

    it("should handle invalid hex data", () => {
      const result = decoder.decodeAsciiData("0x123xyz");
      expect(result.success).toBe(false);
      expect(result.error).toContain("invalid hex");
    });
  });

  describe("decodeFunctionCall", () => {
    it("should decode ERC20 transfer function call", () => {
      const functionCallData =
        "0xa9059cbb0000000000000000000000008b4b268a9aa797fd60889e88ac7be9a0c4b37ff40000000000000000000000000000000000000000000000000000000511b5ac00";

      const result = decoder.decodeFunctionCall(functionCallData);

      expect(result.success).toBe(true);
      expect(result.name).toBe("transfer");
      expect(result.signature).toBe("0xa9059cbb");
      expect(result.params).toHaveLength(2);
      // First param is the recipient address - compare lowercase versions to handle checksum addresses
      expect(result.params?.[0].toLowerCase()).toBe(
        "0x8b4b268a9aa797fd60889e88ac7be9a0c4b37ff4"
      );
      // Second param is the amount (as BigInt)
      expect(result.params?.[1].toString()).toBe("21771955200");
    });

    it("should handle unknown function selectors", () => {
      const unknownFunction =
        "0xabcdef120000000000000000000000000000000000000000000000000000000000000001";

      const result = decoder.decodeFunctionCall(unknownFunction);

      expect(result.success).toBe(true);
      expect(result.signature).toBe("0xabcdef12");
      expect(result.name).toBeUndefined();
    });

    it("should handle data that's too short", () => {
      const result = decoder.decodeFunctionCall("0x1234");
      expect(result.success).toBe(false);
      expect(result.error).toContain("too short");
    });
  });

  describe("formatDecodedData", () => {
    it("should format successful decoded data", () => {
      const decodedData = { success: true, value: "test data" };
      const formatted = decoder.formatDecodedData(decodedData);
      expect(formatted).toBe("test data");
    });

    it("should format error messages", () => {
      const decodedData = { success: false, value: "", error: "test error" };
      const formatted = decoder.formatDecodedData(decodedData);
      expect(formatted).toContain("Error");
      expect(formatted).toContain("test error");
    });

    it("should truncate long values", () => {
      const longValue = "a".repeat(200);
      const decodedData = { success: true, value: longValue };
      const formatted = decoder.formatDecodedData(decodedData);
      expect(formatted.length).toBeLessThan(longValue.length);
      expect(formatted).toContain("...");
    });
  });
});
