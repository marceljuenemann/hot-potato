import { Authorization } from "./authorization";
import { Potato } from "./core";
import { FrostyFunctionsClient } from "./frosty/frosty";
import { Chain, Commit } from "./frosty/frosty-functions-backend.did";
import { computeAddress, recoverAddress, Signature, SigningKey } from "ethers";
import { publicKey } from "./publickey";
import { lastValueFrom } from "rxjs/internal/lastValueFrom";

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

  // 1. Check whether the signing job was already created.
  let job = await frosty.getJob(chain, Number(authorization.signatureId));
  if (!job) {
    // 2. If not, submit the job.
    if (!await frosty.indexTransaction(chain, authorization)) {
      throw new Error("Failed to create signing job. Check authorization is valid");
    }
  }

  // 3. Wait for the job to complete unless it is already.
  if (!(job && ('Completed' in job.status || 'Failed' in job.status))) {
    job = await lastValueFrom(frosty.watchJob(chain, Number(authorization.signatureId)));
    if (!job) {
      throw new Error("No signing job even though we submitted it. This should not happen.");
    }
  }
  if ('Failed' in job.status) {
    throw new Error(`Signing job failed with: ${job.status['Failed']}`);
  }
  if (job.commit_ids.length != 2) {
    throw new Error(`Signing job logs do not match expected format.`);
  }

  // 4. Parse the signature from the job logs.
  const commit: Commit = await frosty.getCommit(job.commit_ids[1]);
  const signature = commit.logs
    .filter(log => 'Default' in log.level)
    .filter(log => log.message.startsWith("Signature"))
    .map(log => log.message.substring("Signature r: ".length));
  if (signature.length != 2) {
    throw new Error(`Signature not found in signing job logs.`);
  }

  // 5. Verify the signature matches the hash and public key.
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
