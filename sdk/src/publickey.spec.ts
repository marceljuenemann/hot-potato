import { describe, expect, it } from 'vitest';
import { HotPotato } from './hotpotato';
import { publicKey } from './publickey';
import { computeAddress } from 'ethers';

describe('publicKey', () => {
  it('derives the correct public key for Hot Potato #1', () => {
    let potato = new HotPotato(BigInt(1));
    expect(publicKey(potato)).toEqual('0x02385f66c8dd087a2bde7e7c339ff01800a77b95a9a7e2b7177f43437c7205dba5');
  });

  it('derives the correct ethereum address for Hot Potato #1', () => {
    let potato = new HotPotato(BigInt(1));
    expect(computeAddress(publicKey(potato))).toEqual('0x76511DE1e763213f9fBc4d735d3364CB8609DBD2');
  });
});
