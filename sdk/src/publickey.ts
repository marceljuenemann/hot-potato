// NOTE: ic-pub-key doesn't seem to bundle the d.ts files correctly.
import { DerivationPath, PublicKeyWithChainCode } from "@dfinity/ic-pub-key/src/ecdsa/secp256k1";
import { Principal } from "@dfinity/principal";
import { Potato } from "./core";

/**
 * Derives the public key of the Potato.
 * 
 * You can derive the ethereum address with ether's computeAddress.
 */
export function publicKey(potato: Potato): string {
  const rootKey = PublicKeyWithChainCode.forMainnetKey('key_1');
  const canisterId = Principal.fromText(potato.canisterId);
  const path = DerivationPath.withCanisterPrefix(canisterId, potato.keyDerivationPath());
  return '0x' + rootKey.deriveSubkeyWithChainCode(path).toHex().public_key;
}
