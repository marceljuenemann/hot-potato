import { Contract } from "ethers";
import { Potato } from "./core";
import { BytesLike, Signer, TransactionResponse } from "ethers";

import potatoAbi from './abi/potato.abi.json';
import { JsonRpcProvider } from "ethers";

/**
 * Calls the signHash function on the Potato NFT contract.
 * 
 * @param potato the potato that will sign the hash
 * @param hash the 32-byte hash to sign
 * @param signerForOwner the signer connected to the wallet owning the potato
 * @returns the transaction
 */
// TODO: rename to authorizeSignature
export async function invokeSignHash(potato: Potato, hash: BytesLike, signerForOwner: Signer): Promise<TransactionResponse> {
  const contract = new Contract(
    potato.contractAddress,
    potatoAbi,
    signerForOwner
  );
  return contract['signHash'](
    potato.tokenId,
    hash,
    {
      value: potato.signatureCost,
      chainId: potato.chainId,
      gasLimit: 70_000
    }
  );
}

/**
 * Fetches the signature authorization for the given Potato and hash from
 * an RPC provider using the transaction that authorized the signature.
 */
export async function fetchAuthorization(potato: Potato, hashToSign: string, transaction: string): Promise<string> {
  const provider = new JsonRpcProvider(potato.defaultRpcProviderUrl);
  const receipt = await provider.getTransactionReceipt(transaction);
  return 'TODO';
}
