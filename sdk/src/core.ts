
/**
 * Potatoes are cheap and nutritious. They provide all the configuration
 * neccessary to interact with a specific Potato in the real world.
 */
export abstract class Potato {

  public constructor(
    public readonly tokenId: bigint
  ) {}

  /**
   * The ID of the Internet Computer canister that generates signatures.
   */
  abstract readonly canisterId: string;

  /**
   * The chain ID on which the Potato NFT is deployed.
   */
  abstract readonly chainId: bigint;

  /**
   * The address of the Potato's NFT contract.
   */
  abstract readonly contractAddress: string;

  /**
   * The suggested RPC provider to use.
   */
  abstract readonly defaultRpcProviderUrl: string;

  /**
   * The cost to request a signature in wei.
   */
  abstract readonly signatureCost: bigint;

  /**
   * Derivation path with which the Potato's key is derived.
   */
  abstract keyDerivationPath(): Uint8Array[];
}
