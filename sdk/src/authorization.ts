import { Contract, getBigInt, Interface, Log } from "ethers";
import { Potato } from "./core";
import { BytesLike, Signer, TransactionResponse } from "ethers";

import potatoAbi from './abi/potato.abi.json';
import { JsonRpcProvider } from "ethers";
import { TransactionReceipt } from "ethers";

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
export async function authorizeSignature(potato: Potato, hash: BytesLike, signerForOwner: Signer): Promise<TransactionResponse> {
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
export async function fetchAuthorization(potato: Potato, hashToSign: string, transaction: string | TransactionResponse): Promise<Authorization | null> {
  const { receipt, transactionHash } = await fetchTransactionReceipt(potato, transaction);
  if (!receipt) return null;

  const abiInterface = new Interface(potatoAbi);
  const topic = abiInterface.getEvent("SignHash")!.topicHash;
  const events = receipt.logs
    .filter(log => log.address.toLowerCase() === potato.contractAddress.toLowerCase())
    .filter(log => log.topics?.[0] === topic)
    .map(log => abiInterface.parseLog(log))
    .filter(event => event !== null)
    .map(event => ({
      tokenId: event.args.tokenId,
      hashToSign: event.args.hash,
      signatureId: event.args.jobId,
    }))
    .filter(authorization => getBigInt(authorization.tokenId) == potato.tokenId)
    .filter(authorization => authorization.hashToSign.toLowerCase() === hashToSign.toLowerCase());
  if (events.length === 0) {
    return null;
  }

  return {
    ...events[0],
    blockHash: receipt.blockHash,
    blockNumber: receipt.blockNumber,
    transactionHash: transactionHash
  }
}

async function fetchTransactionReceipt(potato: Potato, transaction: string | TransactionResponse): Promise<{receipt: TransactionReceipt | null, transactionHash: string}> {
  if (typeof transaction === 'string') {
    const provider = new JsonRpcProvider(potato.defaultRpcProviderUrl);
    return { receipt: await provider.getTransactionReceipt(transaction), transactionHash: transaction };
  } else {
    return { receipt: await transaction.wait(), transactionHash: transaction.hash };
  }
}
