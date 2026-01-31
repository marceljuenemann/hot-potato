import { Contract } from "ethers";
import { Potato } from "./core";
import { BytesLike, Signer, TransactionResponse } from "ethers";

import potatoAbi from './abi/potato.abi.json';

/**
 * Calls the signHash function on the Potato NFT contract.
 * 
 * @param potato the potato that will sign the hash
 * @param hash the 32-byte hash to sign
 * @param signerForOwner the signer connected to the wallet owning the potato
 * @returns the transaction
 */
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
