import { Actor, ActorMethodMappedExtended, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { _SERVICE, Chain, Commit, idlFactory, Job } from "./frosty-functions-backend.did.js";

export class FrostyFunctionsClient {
  private _actor: ActorSubclass<ActorMethodMappedExtended<_SERVICE>> | null = null;

  constructor(private readonly canisterId: string) {}

  private async actor(): Promise<ActorSubclass<ActorMethodMappedExtended<_SERVICE>>> {
    if (this._actor) return this._actor;
    let agent = await HttpAgent.create({
      host: 'https://icp-api.io'  // If we remove this, the client won't work on localhost.
    });
    return this._actor = Actor.createActorWithExtendedDetails<_SERVICE>(
      idlFactory,
      { agent, canisterId: this.canisterId }
    )
  }

  /**
   * Asks the backend to index the given transaction. Resolves to the JobRequest created,
   * or rejects if indexing failed.
   */
  /*
  async indexTransaction(chain: Chain, receipt: TransactionReceipt): Promise<JobRequest> {
    // TODO: Why is type not inferred correctly here?
    const response: {result: Promise<Result>} = await (await this.actor()).index_block(chain, receipt.blockNumber) as any;
    const result: Result = await response.result;
    if ('Err' in result) throw new Error(`${result.Err}`);

    // There might be JobRequests for other transactions in the same block; filter them out
    const jobRequests = result.Ok.filter(req => req.transaction_hash && req.transaction_hash[0] === receipt.hash);
    if (jobRequests.length != 1) {
      throw new Error(`Expected exactly one JobRequest for transaction ${receipt.hash}, got ${jobRequests.length}`);
    }
    return jobRequests[0];
  }
  */

  async getJob(chain: Chain, jobId: number): Promise<Job | null> {
    // TODO: Why is type not inferred correctly here?
    const response: any = await (await this.actor()).get_job(chain, jobId);
    const result: Job[] = await response.result;
    if (!result.length) return null;
    return result[0];
  }

  /**
   * Watches the given job until its status is either Completed or Failed.
   */
  /*
  watchJob(chain: Chain, jobId: number): Observable<Job | null> {
    const pollInterval = 1000;  // Poll every second
    return interval(pollInterval).pipe(
      switchMap(() => this.getJob(chain, jobId)),
      takeWhile(job => !!(job && !('Completed' in job.status) && !("Failed" in job.status)), true)
    );
  }
    */

  async getCommit(commitId: bigint): Promise<Commit> {
    const response = await ((await (await this.actor()).get_commit(commitId)).result);
    if (!response.length) {
      throw new Error(`Commit ${commitId} not found`);
    }
    return response[0];
  }
}
