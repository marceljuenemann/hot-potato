import { Contract, getDefaultProvider, Provider, Signer } from "ethers";
import POTATO_ABI from "./abi/potato.abi.json";
import { TransactionResponse } from "ethers";
import { Interface } from "ethers";

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

export async function getOwner(potato: Potato, provider?: Provider): Promise<string> {
  const rpcProvider = provider ?? getDefaultProvider(potato.defaultRpcProviderUrl);
  const contract = new Contract(potato.contractAddress, POTATO_ABI, rpcProvider);
  return contract['ownerOf'](potato.tokenId);
}

// TODO: This is an ugly API, can't require a Potato instance here. Maybe need a
// PotatoKind class?
export async function mint(contractAddress: string, signer: Signer): Promise<bigint | null> {
  const iface = new Interface(POTATO_ABI);
  const contract = new Contract(contractAddress, iface, signer);
  const tx: TransactionResponse = await contract['mint']();
  const receipt = await tx.wait();
  if (!receipt) return null;

  const topic = iface.getEvent("Minted")!.topicHash; 
  const events = receipt.logs
    .filter(log => log.address.toLowerCase() === contractAddress.toLowerCase())
    .filter(log => log.topics?.[0] === topic)
    .map(log => iface.parseLog(log))
    .filter(event => event !== null)
    .map(event => ({
      tokenId: event.args.tokenId
    }));
  if (events.length === 0) {
    return null;
  }
  return events[0].tokenId;
}
