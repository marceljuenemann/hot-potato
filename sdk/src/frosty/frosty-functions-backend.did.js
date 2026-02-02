export const idlFactory = ({ IDL }) => {
  const FunctionDefinition = IDL.Record({
    'source' : IDL.Text,
    'compiler' : IDL.Text,
    'binary' : IDL.Vec(IDL.Nat8),
  });
  const DeployResult = IDL.Variant({
    'Error' : IDL.Text,
    'Duplicate' : IDL.Vec(IDL.Nat8),
    'Success' : IDL.Vec(IDL.Nat8),
  });
  const LogType = IDL.Variant({ 'System' : IDL.Null, 'Default' : IDL.Null });
  const LogEntry = IDL.Record({ 'level' : LogType, 'message' : IDL.Text });
  const Commit = IDL.Record({
    'title' : IDL.Text,
    'fees' : IDL.Nat64,
    'logs' : IDL.Vec(LogEntry),
    'instructions' : IDL.Nat64,
    'timestamp' : IDL.Nat64,
  });
  const FunctionState = IDL.Record({
    'hash' : IDL.Vec(IDL.Nat8),
    'deployed_at' : IDL.Nat64,
    'is_verified' : IDL.Bool,
    'definition' : FunctionDefinition,
  });
  const EvmChain = IDL.Variant({
    'ArbitrumSepolia' : IDL.Null,
    'ArbitrumOne' : IDL.Null,
    'Localhost' : IDL.Null,
  });
  const Chain = IDL.Variant({ 'Evm' : EvmChain });
  const JobStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Executing' : IDL.Null,
    'Waiting' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Address = IDL.Variant({ 'EvmAddress' : IDL.Text });
  const JobRequest = IDL.Record({
    'transaction_hash' : IDL.Opt(IDL.Text),
    'block_hash' : IDL.Opt(IDL.Text),
    'data' : IDL.Vec(IDL.Nat8),
    'chain' : Chain,
    'on_chain_id' : IDL.Opt(IDL.Nat),
    'block_number' : IDL.Opt(IDL.Nat64),
    'function_hash' : IDL.Vec(IDL.Nat8),
    'gas_payment' : IDL.Nat,
    'caller' : Address,
  });
  const Job = IDL.Record({
    'status' : JobStatus,
    'base_fee' : IDL.Nat64,
    'execution_fees' : IDL.Nat64,
    'request' : JobRequest,
    'created_at' : IDL.Nat64,
    'gas_fees' : IDL.Nat64,
    'commit_ids' : IDL.Vec(IDL.Nat64),
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Vec(JobRequest), 'Err' : IDL.Text });
  const Caller = IDL.Record({ 'chain' : Chain, 'address' : Address });
  const SignerInfo = IDL.Record({
    'public_key' : IDL.Text,
    'eth_address' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'Ok' : SignerInfo, 'Err' : IDL.Text });
  const SimulationResult = IDL.Record({
    'job' : Job,
    'error' : IDL.Opt(IDL.Text),
    'commits' : IDL.Vec(Commit),
  });
  const Result_2 = IDL.Variant({ 'Ok' : SimulationResult, 'Err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  return IDL.Service({
    'deploy_function' : IDL.Func(
        [FunctionDefinition, IDL.Opt(IDL.Text)],
        [DeployResult],
        [],
      ),
    'get_commit' : IDL.Func([IDL.Nat64], [IDL.Opt(Commit)], ['query']),
    'get_evm_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_function' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Opt(FunctionState)],
        ['query'],
      ),
    'get_job' : IDL.Func([Chain, IDL.Nat], [IDL.Opt(Job)], ['query']),
    'index_block' : IDL.Func([Chain, IDL.Nat64], [Result], []),
    'signer_for_caller' : IDL.Func(
        [Caller, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [Result_1],
        ['query'],
      ),
    'signer_for_function' : IDL.Func(
        [IDL.Vec(IDL.Nat8), IDL.Opt(IDL.Vec(IDL.Nat8))],
        [Result_1],
        ['query'],
      ),
    'simulate_execution' : IDL.Func(
        [JobRequest, IDL.Vec(IDL.Nat8)],
        [Result_2],
        ['query'],
      ),
    'tmp_set_api_keys' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Vec(IDL.Text))],
        [Result_3],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
