import { getBytes, toBeArray } from "ethers/utils";
import { Potato } from "./core";
import { concat } from "ethers";
import { BigNumberish, getBigInt } from "ethers";

export function hotPotato(tokenId: BigNumberish): HotPotato {
  return new HotPotato(getBigInt(tokenId));
}

/**
 * Hot Potatoes. The original potatoes deployed on Arbitrum One.
 */
export class HotPotato extends Potato {

  public readonly canisterId = 'n6va3-cyaaa-aaaao-qk6pq-cai';
  public readonly chainId = BigInt(42161);  // Arbitrum One
  public readonly contractAddress = '0xf349317Fc182e1d8755fBee72946616182fFeaBd';  // TODO: Update
  public readonly signatureCost = BigInt(29e12);  // 29k gwei (still fits into number)

  keyDerivationPath(): Uint8Array[] {
    // The derivation path needs to match the Frosty Function, see
    // https://github.com/marceljuenemann/frosty-functions/blob/main/src/frosty-functions-backend/src/signer/signer.rs#L90
    return [
      new TextEncoder().encode('❄️/caller'),
      getBytes(concat([
        new Uint8Array([0]),              // 1 byte chain type (EVM = 0)
        toBeArray(this.chainId, 8),       // 8 bytes chain ID
        toBeArray(this.contractAddress)   // 20 bytes address
      ])),
      toBeArray(this.tokenId, 32)         // 32 bytes token ID
    ];
  }
}
