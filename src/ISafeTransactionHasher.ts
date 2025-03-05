// Generic type for Ethereum addresses (0x-prefixed hex string)
export type EthAddress = `0x${string}`;

// Generic type for hex data (0x-prefixed hex string)
export type HexData = `0x${string}`;

// Generic type for hash values (0x-prefixed hex string)
export type HashValue = `0x${string}`;

export interface SafeTransactionParams {
  to: EthAddress;
  value: bigint;
  data: HexData;
  operation: 0 | 1;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: EthAddress;
  refundReceiver: EthAddress;
  nonce: number;
}

export interface DomainData {
  chainId: number;
  verifyingContract: EthAddress;
}

export interface ISafeTransactionHasher {
  getTypeHashes(): {
    safeTxTypeHash: HashValue;
    domainSeparatorTypeHash: HashValue;
  };

  getDomainHash(): HashValue;

  calculateRawSafeTxHash(tx: SafeTransactionParams): HashValue;

  calculateFinalSafeTxHash(tx: SafeTransactionParams): HashValue;

  calculateMessageHash(tx: SafeTransactionParams): HashValue;

  calculateSafeTransactionHash(tx: SafeTransactionParams): HashValue;

  getAllHashes(tx: SafeTransactionParams): {
    safeTxHash: HashValue;
    domainHash: HashValue;
    messageHash: HashValue;
  };
}
