import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Address = { 'EvmAddress' : string };
export interface Caller { 'chain' : Chain, 'address' : Address }
export type Chain = { 'Evm' : EvmChain };
export interface Commit {
  'title' : string,
  'fees' : bigint,
  'logs' : Array<LogEntry>,
  'instructions' : bigint,
  'timestamp' : bigint,
}
export type DeployResult = { 'Error' : string } |
  { 'Duplicate' : Uint8Array | number[] } |
  { 'Success' : Uint8Array | number[] };
export type EvmChain = { 'ArbitrumSepolia' : null } |
  { 'ArbitrumOne' : null } |
  { 'Localhost' : null };
export interface FunctionDefinition {
  'source' : string,
  'compiler' : string,
  'binary' : Uint8Array | number[],
}
export interface FunctionState {
  'hash' : Uint8Array | number[],
  'deployed_at' : bigint,
  'is_verified' : boolean,
  'definition' : FunctionDefinition,
}
export interface Job {
  'status' : JobStatus,
  'base_fee' : bigint,
  'execution_fees' : bigint,
  'request' : JobRequest,
  'created_at' : bigint,
  'gas_fees' : bigint,
  'commit_ids' : BigUint64Array | bigint[],
}
export interface JobRequest {
  'transaction_hash' : [] | [string],
  'block_hash' : [] | [string],
  'data' : Uint8Array | number[],
  'chain' : Chain,
  'on_chain_id' : [] | [bigint],
  'block_number' : [] | [bigint],
  'function_hash' : Uint8Array | number[],
  'gas_payment' : bigint,
  'caller' : Address,
}
export type JobStatus = { 'Failed' : string } |
  { 'Executing' : null } |
  { 'Waiting' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export interface LogEntry { 'level' : LogType, 'message' : string }
export type LogType = { 'System' : null } |
  { 'Default' : null };
export type Result = { 'Ok' : Array<JobRequest> } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : SignerInfo } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : SimulationResult } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : null } |
  { 'Err' : string };
export interface SignerInfo { 'public_key' : string, 'eth_address' : string }
export interface SimulationResult {
  'job' : Job,
  'error' : [] | [string],
  'commits' : Array<Commit>,
}
export interface _SERVICE {
  /**
   * Deploy a new function.
   */
  'deploy_function' : ActorMethod<
    [FunctionDefinition, [] | [string]],
    DeployResult
  >,
  'get_commit' : ActorMethod<[bigint], [] | [Commit]>,
  'get_evm_address' : ActorMethod<[], string>,
  /**
   * Retrieve function definition and state by its ID.
   */
  'get_function' : ActorMethod<[Uint8Array | number[]], [] | [FunctionState]>,
  'get_job' : ActorMethod<[Chain, bigint], [] | [Job]>,
  /**
   * Looks for jobs in the specified block on the given chain.
   * TODO: Currently this call is exposed to the public and invoked from the frontend.
   * This is problematic as the call incurs costs the RPC and could be used to drain cycles.
   * In the future we could require addition of cycles to the call that are refunded only
   * if new jobs were found in the block. We should also provide an (off chain?) indexer to
   * watch for new blocks and call this method automatically.
   */
  'index_block' : ActorMethod<[Chain, bigint], Result>,
  'signer_for_caller' : ActorMethod<
    [Caller, [] | [Uint8Array | number[]]],
    Result_1
  >,
  'signer_for_function' : ActorMethod<
    [Uint8Array | number[], [] | [Uint8Array | number[]]],
    Result_1
  >,
  'simulate_execution' : ActorMethod<
    [JobRequest, Uint8Array | number[]],
    Result_2
  >,
  'tmp_set_api_keys' : ActorMethod<[string, [] | [Array<string>]], Result_3>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
