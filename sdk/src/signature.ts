import { Authorization } from "./authorization";
import { Potato } from "./core";
import { FrostyFunctionsClient } from "./frosty/frosty";
import { Chain, Commit } from "./frosty/frosty-functions-backend.did";
import { computeAddress, recoverAddress, Signature, SigningKey } from "ethers";
import { publicKey } from "./publickey";

/**
 * Fetches an already authorized signature from the Internet Computer and
 * verifies it with the Potato's public key.
 *
 * Note that the canister will verify the authorization with HTTP outcalls
 * to RPC providers.
 */
export async function fetchSignature(potato: Potato, authorization: Authorization): Promise<Signature> {
  // TODO: We might want to cache the FrostyClient.
  const frosty = new FrostyFunctionsClient(potato.canisterId);
  const chain: Chain = { 'Evm': { 'ArbitrumOne': null } };
  const job = await frosty.getJob(chain, Number(authorization.signatureId));
  if (!job) {
    // TODO: Submit job.
    throw new Error(`No job found with ID ${authorization.signatureId}`);
  }
  // TODO: Wait for job to complete here 
  if ('Failed' in job.status) {
    throw new Error(`Signing job failed with: ${job.status['Failed']}`);
  }
  if (job.commit_ids.length != 2) {
    throw new Error(`Signing job logs do not match expected format.`);
  }

  const commit: Commit = await frosty.getCommit(job.commit_ids[1]);
  const signature = commit.logs
    .filter(log => 'Default' in log.level)
    .filter(log => log.message.startsWith("Signature"))
    .map(log => log.message.substring("Signature r: ".length));
  if (signature.length != 2) {
    throw new Error(`Signature not found in signing job logs.`);
  }

  return verifySignature(potato, authorization.hashToSign, signature[0], signature[1]);
}

/**
 * ICP only returns the r and s values of the signature. We determine
 * the parity by trying both options and seeing which one recovers.
 */
export function verifySignature(potato: Potato, hashToSign: string, r: string, s: string): Signature {
  const expectedAddress = computeAddress(publicKey(potato));
  for (let v of [27, 28]) {
    const sig = Signature.from({ r, s, v })
    if (recoverAddress(hashToSign, sig) === expectedAddress) {
      return sig;
    }
  }
  throw new Error("Signature does not match digest and public key");
}
