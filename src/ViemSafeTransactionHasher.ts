import {
  Address,
  Hash,
  Hex,
  concat,
  encodeAbiParameters,
  keccak256,
  pad,
  toHex,
} from "viem";

import {
  DomainData as IDomainData,
  EthAddress,
  HashValue,
  ISafeTransactionHasher,
  SafeTransactionParams as ISafeTransactionParams,
} from "./ISafeTransactionHasher";

// Type conversion helpers
type SafeTransactionParams = {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0 | 1;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: number;
};

type DomainData = {
  chainId: number;
  verifyingContract: Address;
};

// Convert interface types to viem types
const toViemParams = (
  params: ISafeTransactionParams
): SafeTransactionParams => {
  return params as SafeTransactionParams;
};

const toViemDomain = (domain: IDomainData): DomainData => {
  return domain as DomainData;
};

export class ViemSafeTransactionHasher implements ISafeTransactionHasher {
  private readonly DOMAIN_SEPARATOR_TYPEHASH: Hash;
  private readonly SAFE_TX_TYPEHASH: Hash;
  private readonly domain: DomainData;
  private readonly domainHash: Hash;

  constructor(domain: IDomainData) {
    this.DOMAIN_SEPARATOR_TYPEHASH = keccak256(
      toHex("EIP712Domain(uint256 chainId,address verifyingContract)")
    );

    this.SAFE_TX_TYPEHASH = keccak256(
      toHex(
        "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
      )
    );

    this.domain = toViemDomain(domain);
    this.domainHash = this.calculateDomainHash();
  }

  public getTypeHashes(): {
    safeTxTypeHash: HashValue;
    domainSeparatorTypeHash: HashValue;
  } {
    return {
      safeTxTypeHash: this.SAFE_TX_TYPEHASH,
      domainSeparatorTypeHash: this.DOMAIN_SEPARATOR_TYPEHASH,
    };
  }

  /**
   * Get the domain separator hash for the Safe
   */
  public getDomainHash(): HashValue {
    return this.domainHash;
  }

  /**
   * Calculate the raw Safe transaction hash (called safeTxHash in the Solidity contract)
   *
   * NOTE: There's a naming difference between the Safe UI and contracts:
   * - In the Safe UI, this is called "messageHash"
   * - In the Safe contracts, this is called "safeTxHash"
   *
   * This matches the Solidity implementation:
   * bytes32 safeTxHash = keccak256(abi.encode(
   *   SAFE_TX_TYPEHASH, to, value, keccak256(data), operation,
   *   safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce
   * ));
   */
  public calculateRawSafeTxHash(tx: ISafeTransactionParams): HashValue {
    const viemTx = toViemParams(tx);

    // Properly encode the data as bytes before hashing it
    // This matches the Solidity keccak256(data) in the contract
    const dataHash = keccak256(viemTx.data);

    // This matches the Solidity abi.encode(...) in the contract
    // We need to use the exact same encoding as the Solidity contract
    return keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "address" },
          { type: "uint256" },
          { type: "bytes32" },
          { type: "uint8" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "address" },
          { type: "address" },
          { type: "uint256" },
        ],
        [
          this.SAFE_TX_TYPEHASH,
          viemTx.to,
          viemTx.value,
          dataHash,
          viemTx.operation,
          viemTx.safeTxGas,
          viemTx.baseGas,
          viemTx.gasPrice,
          viemTx.gasToken,
          viemTx.refundReceiver,
          BigInt(viemTx.nonce),
        ]
      )
    );
  }

  /**
   * Calculate the final Safe transaction hash (called getTransactionHash in the Solidity contract)
   *
   * NOTE: There's a naming difference between the Safe UI and contracts:
   * - In the Safe UI, this is called "safeTxHash"
   * - In the Safe contracts, this is the result of getTransactionHash()
   *
   * This matches the Solidity implementation:
   * return keccak256(abi.encodePacked(bytes1(0x19), bytes1(0x01), domainSeparator(), safeTxHash));
   *
   * The prefix 0x1901 is a safety measure from EIP-712:
   * - 0x19: Prevents signature collisions with other message types (EIP-191)
   * - 0x01: Indicates this is an EIP-712 structured data message
   */
  public calculateFinalSafeTxHash(tx: ISafeTransactionParams): HashValue {
    const rawSafeTxHash = this.calculateRawSafeTxHash(tx);

    // Create the packed data without hashing (matches encodeTransactionData in the contract)
    // Use the exact same format as the Solidity contract
    const packedData = concat(["0x19", "0x01", this.domainHash, rawSafeTxHash]);

    // Then hash it (matches getTransactionHash in the contract)
    return keccak256(packedData);
  }

  /**
   * For backward compatibility
   */
  public calculateMessageHash(tx: ISafeTransactionParams): HashValue {
    return this.calculateRawSafeTxHash(tx);
  }

  /**
   * For backward compatibility
   */
  public calculateSafeTransactionHash(tx: ISafeTransactionParams): HashValue {
    return this.calculateFinalSafeTxHash(tx);
  }

  /**
   * Get all hashes for a Safe transaction
   *
   * NOTE: The naming here follows the Safe UI convention:
   * - messageHash: The raw hash of the transaction data (safeTxHash in Solidity)
   * - safeTxHash: The final EIP-712 compliant hash (result of getTransactionHash in Solidity)
   * - domainHash: The domain separator hash
   */
  public getAllHashes(tx: ISafeTransactionParams): {
    safeTxHash: HashValue;
    domainHash: HashValue;
    messageHash: HashValue;
  } {
    const messageHash = this.calculateRawSafeTxHash(tx);
    const safeTxHash = this.calculateFinalSafeTxHash(tx);

    return {
      safeTxHash,
      domainHash: this.domainHash,
      messageHash,
    };
  }

  private calculateDomainHash(): Hash {
    return keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }],
        [
          this.DOMAIN_SEPARATOR_TYPEHASH,
          BigInt(this.domain.chainId),
          this.domain.verifyingContract,
        ]
      )
    );
  }
}
