import { Contract, getBigInt, Interface, Log } from "ethers";
import { Potato } from "./core";
import { BytesLike, Signer, TransactionResponse } from "ethers";

import potatoAbi from './abi/potato.abi.json';
import { JsonRpcProvider } from "ethers";

export interface Authorization {
  blockHash: string;
  blockNumber: number;
  hashToSign: string;
  signatureId: bigint;
  tokenId: bigint;
  transactionHash: string;
}

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
export async function fetchAuthorization(potato: Potato, hashToSign: string, transaction: string): Promise<Authorization | null> {
  const transactionHash = transaction; // TODO: Support TransactionResponse.
  const provider = new JsonRpcProvider(potato.defaultRpcProviderUrl);
  const receipt = await provider.getTransactionReceipt(transaction);
  if (!receipt) return null;

  const abiInterface = new Interface(potatoAbi);
  const signHashTopic = abiInterface.getEvent("SignHash")!.topicHash;
  const events = receipt.logs
    .filter(log => log.address.toLowerCase() === potato.contractAddress.toLowerCase())
    .filter(log => log.topics?.[0] === signHashTopic)
    .map(log => abiInterface.parseLog(log))
    .filter(event => event !== null)
    .map(event => ({
      tokenId: event.args.tokenId,
      hashToSign: event.args.hash,
      signatureId: event.args.jobId,
    }))
    .filter(authorization => getBigInt(authorization.tokenId) == potato.tokenId)
    // TODO: Re-enable after testing.
    //.filter(authorization => authorization.hashToSign.toLowerCase() === hashToSign.toLowerCase());
  if (events.length === 0) {
    return null;
  }

  return {
    ...events[0],
    blockHash: receipt.blockHash,
    blockNumber: receipt.blockNumber,
    transactionHash
  }
}
