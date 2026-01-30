import { Signer, hex } from "frosty";
import { CALLDATA } from "frosty/env";

export function main(): void {
  if (CALLDATA.length != 64) {
    throw "CALLDATA must be 64 bytes long"
  } 

  const tokenId = CALLDATA.slice(0, 32);
  const hash = CALLDATA.slice(32, 64);
  console.log(`Token ID: ${hex.encode(tokenId)}`);
  console.log(`Hash to sign: ${hex.encode(hash)}`);
  
  const signer = Signer.forCaller(tokenId);
  signer.signWithEcsda(hash).then(signature => {
    console.log(`Signature r: ${hex.encode(signature.r)}`);
    console.log(`Signature s: ${hex.encode(signature.s)}`);
  })
}
