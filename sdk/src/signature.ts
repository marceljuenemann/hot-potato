import { Authorization } from "./authorization";
import { Potato } from "./core";
import { FrostyFunctionsClient } from "./frosty/frosty";
import { Chain } from "./frosty/frosty-functions-backend.did";


/**
 * Fetches a already authorized signature from the Internet Computer.
 *
 * Note that the canister will verify the authorization with HTTP outcalls
 * to RPC providers.
 */
export async function fetchSignature(potato: Potato, authorization: Authorization): Promise<string> {
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
  
  console.log("Fetched job from IC:", job);

  return "TODO";
}
