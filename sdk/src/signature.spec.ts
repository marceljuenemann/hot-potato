import { describe, expect, it } from 'vitest';
import { verifySignature } from './signature';
import { hotPotato } from './hotpotato';

describe('verifySignature', () => {
  it('recovers v correctly', () => {
    let potato = hotPotato(1);
    let r = '0x36b57c21a2f9507d90c54e3e4e76e389c272f8945de5d75c8b219010c03ec612';
    let s = '0x27fa0cfd05d46176c92854e07624c49a7fcf6acb09c6db50c9c4d8673617c070';
    let digest = '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2';

    let sig = verifySignature(potato, digest, r, s);
    expect(sig.v).toBe(28);
  });

  it('throws on invalid signature', () => {
    let potato = hotPotato(1);
    let r = '0x36b57c21a2f9507d90c54e3e4e76e389c272f8945de5d75c8b219010c03ec610';
    let s = '0x27fa0cfd05d46176c92854e07624c49a7fcf6acb09c6db50c9c4d8673617c070';
    let digest = '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2';

    expect(() => verifySignature(potato, digest, r, s)).toThrowError("Cannot find square root");
  });

  it('throws on mismatched public key', () => {
    let potato = hotPotato(2);
    let r = '0x36b57c21a2f9507d90c54e3e4e76e389c272f8945de5d75c8b219010c03ec612';
    let s = '0x27fa0cfd05d46176c92854e07624c49a7fcf6acb09c6db50c9c4d8673617c070';
    let digest = '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2';

    expect(() => verifySignature(potato, digest, r, s)).toThrowError("Signature does not match digest and public key");
  });
});
