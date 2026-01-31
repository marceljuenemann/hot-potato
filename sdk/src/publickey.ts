import { secp256k1 } from "@dfinity/ic-pub-key/ecdsa";
import { Principal } from "@dfinity/principal";
import { Potato } from "./core";

/**
 * Derives the public key of the Potato.
 * 
 * You can derive the ethereum address with ether's computeAddress.
 */
export function publicKey(potato: Potato): string {
  const rootKey = secp256k1.PublicKeyWithChainCode.forMainnetKey('key_1');
  const canisterId = Principal.fromText(potato.canisterId);
  const path = secp256k1.DerivationPath.withCanisterPrefix(canisterId, potato.keyDerivationPath());
  return '0x' + rootKey.deriveSubkeyWithChainCode(path).toHex().public_key;
}
