import { Component, computed, input } from '@angular/core';
import { computeAddress, BrowserProvider, keccak256 } from 'ethers';
import { hotPotato, publicKey, invokeSignHash } from 'potato-sdk';

@Component({
  selector: 'app-potato',
  imports: [],
  templateUrl: './potato.html',
  styleUrl: './potato.css',
})
export class Potato {
  tokenId = input.required<string>();
  potato = computed(() => hotPotato(this.tokenId()));
  publicKey = computed(() => publicKey(this.potato()));
  ethAddress = computed(() => computeAddress(this.publicKey()));

  async signPersonalMessage(msg: string) {
    console.log("Signing message:", msg);
    const data = "\x19Ethereum Signed Message:\n" + msg.length + msg;
    const hash = keccak256(new TextEncoder().encode(data));

    try {
      const provider = await this.providerForChain(this.potato().chainId);
      const signerForOwner = await provider.getSigner();

      const transaction = await invokeSignHash(
        this.potato(),
        hash,
        signerForOwner
      );
      console.log(transaction);

      const receipt = await transaction.wait();
      console.log(receipt);
    } catch (e) {
      console.error("Error signing message:", e);
      //alert(e);  // TODO: Better error handling
    }
  }

  /**
   * Simple MetaMask provider.
   *
   * TODO: Support other wallets.
   */
  async providerForChain(chainId: bigint): Promise<BrowserProvider> {
    if ((window as any).ethereum == null) throw new Error("MetaMask not installed");
    const provider = new BrowserProvider((window as any).ethereum);
    await provider.send('wallet_switchEthereumChain', [{
      chainId: '0x' + chainId.toString(16)
    }]);
    const network = await provider.getNetwork();
    if (network.chainId !== chainId) {
      throw new Error(`Connected to wrong network: ${network.chainId}, expected ${chainId}`);
    }
    return provider;
  }
}
