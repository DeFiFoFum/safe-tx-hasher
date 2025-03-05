import { zeroAddress } from "viem";
import * as chains from "viem/chains";
import {
  DomainData,
  SafeTransactionParams,
} from "../src/ISafeTransactionHasher";
import { ViemSafeTransactionHasher } from "../src/ViemSafeTransactionHasher";
import { EthersSafeTransactionHasher } from "../src/EthersSafeTransactionHasher";

describe("SafeTransactionHasher", () => {
  const domain: DomainData = {
    chainId: chains.linea.id,
    verifyingContract: "0xDb73ba19F072D0Fbc865781Ba468A9F8B77aD2C4",
  };

  const safeTransaction: SafeTransactionParams = {
    to: "0x8b4B268a9aA797fD60889E88AC7bE9a0C4b37Ff4",
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

  // Expected hashes in the order specified by Gnosis Safe
  const expectedHashes = {
    safeTxHash:
      "0x64b865a13a4d2968c6f6428a4403a2df33c35171d482322238bbac22698e6189",
    domainHash:
      "0x7ae3819992af9cb3416bfbfc483b427868cec8257ab807445212b48a5ca86dfd",
    messageHash:
      "0xd7a20bc0e18961ef47e55f868cdcd8d41a58bb689ee1837dafe8aa99a588494a",
  };

  describe("Viem Implementation", () => {
    it("should generate correct typehashes", () => {
      const hasher = new ViemSafeTransactionHasher(domain);
      const typeHashes = hasher.getTypeHashes();
      expect(typeHashes.domainSeparatorTypeHash).toBe(
        "0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218"
      );
      expect(typeHashes.safeTxTypeHash).toBe(
        "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8"
      );
    });

    it("should generate correct domainHash", () => {
      const hasher = new ViemSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      expect(result.domainHash).toBe(expectedHashes.domainHash);
    });

    it("should generate correct messageHash", () => {
      const hasher = new ViemSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      console.log("Viem messageHash:", result.messageHash);
      expect(result.messageHash).toBe(expectedHashes.messageHash);
    });

    it("should generate correct safeTxHash", () => {
      const hasher = new ViemSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      console.log("Viem safeTxHash:", result.safeTxHash);
      expect(result.safeTxHash).toBe(expectedHashes.safeTxHash);
    });
  });

  describe("Ethers Implementation", () => {
    it("should generate correct typehashes", () => {
      const hasher = new EthersSafeTransactionHasher(domain);
      const typeHashes = hasher.getTypeHashes();
      expect(typeHashes.domainSeparatorTypeHash).toBe(
        "0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218"
      );
      expect(typeHashes.safeTxTypeHash).toBe(
        "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8"
      );
    });

    it("should generate correct domainHash", () => {
      const hasher = new EthersSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      expect(result.domainHash).toBe(expectedHashes.domainHash);
    });

    it("should generate correct messageHash", () => {
      const hasher = new EthersSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      console.log("Ethers messageHash:", result.messageHash);
      expect(result.messageHash).toBe(expectedHashes.messageHash);
    });

    it("should generate correct safeTxHash", () => {
      const hasher = new EthersSafeTransactionHasher(domain);
      const result = hasher.getAllHashes(safeTransaction);
      console.log("Ethers safeTxHash:", result.safeTxHash);
      expect(result.safeTxHash).toBe(expectedHashes.safeTxHash);
    });
  });
});
