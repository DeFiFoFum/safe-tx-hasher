import { ethers } from "ethers";

import {
  DomainData,
  EthAddress,
  HashValue,
  ISafeTransactionHasher,
  SafeTransactionParams,
} from "./ISafeTransactionHasher";

export class EthersSafeTransactionHasher implements ISafeTransactionHasher {
  private readonly DOMAIN_SEPARATOR_TYPEHASH: HashValue;
  private readonly SAFE_TX_TYPEHASH: HashValue;
  private readonly domain: DomainData;
  private readonly domainHash: HashValue;

  constructor(domain: DomainData) {
    // Calculate type hashes using ethers
    this.DOMAIN_SEPARATOR_TYPEHASH = ethers.keccak256(
      ethers.toUtf8Bytes(
        "EIP712Domain(uint256 chainId,address verifyingContract)"
      )
    ) as HashValue;

    this.SAFE_TX_TYPEHASH = ethers.keccak256(
      ethers.toUtf8Bytes(
        "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
      )
    ) as HashValue;

    this.domain = domain;
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
  public calculateRawSafeTxHash(tx: SafeTransactionParams): HashValue {
    // First hash the data directly - matches keccak256(data) in the contract
    const dataHash = ethers.keccak256(tx.data) as HashValue;

    // Then encode all parameters - matches abi.encode(...) in the contract
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "bytes32",
        "address",
        "uint256",
        "bytes32",
        "uint8",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "address",
        "uint256",
      ],
      [
        this.SAFE_TX_TYPEHASH,
        tx.to,
        tx.value,
        dataHash,
        tx.operation,
        tx.safeTxGas,
        tx.baseGas,
        tx.gasPrice,
        tx.gasToken,
        tx.refundReceiver,
        tx.nonce,
      ]
    );

    // Finally hash the encoded data - matches keccak256(abi.encode(...)) in the contract
    return ethers.keccak256(encodedData) as HashValue;
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
  public calculateFinalSafeTxHash(tx: SafeTransactionParams): HashValue {
    const rawSafeTxHash = this.calculateRawSafeTxHash(tx);

    // First create the packed data - matches encodeTransactionData in the contract
    // Use individual bytes to ensure exact matching with the Solidity implementation
    const packedData = ethers.concat([
      "0x19",
      "0x01",
      this.domainHash,
      rawSafeTxHash,
    ]);

    // Then hash it - matches getTransactionHash in the contract
    return ethers.keccak256(packedData) as HashValue;
  }

  /**
   * For backward compatibility
   */
  public calculateMessageHash(tx: SafeTransactionParams): HashValue {
    return this.calculateRawSafeTxHash(tx);
  }

  /**
   * For backward compatibility
   */
  public calculateSafeTransactionHash(tx: SafeTransactionParams): HashValue {
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
  public getAllHashes(tx: SafeTransactionParams): {
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

  private calculateDomainHash(): HashValue {
    const encodedDomain = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "address"],
      [
        this.DOMAIN_SEPARATOR_TYPEHASH,
        this.domain.chainId,
        this.domain.verifyingContract,
      ]
    );

    return ethers.keccak256(encodedDomain) as HashValue;
  }
}
