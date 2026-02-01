import { Component, computed, input, OnInit } from '@angular/core';
import { computeAddress, BrowserProvider, getBytes, keccak256 } from 'ethers';
import { hotPotato, publicKey, invokeSignHash } from 'potato-sdk';

import { Core } from "@walletconnect/core";
import { IWalletKit, WalletKit, WalletKitTypes } from "@reown/walletkit";
import { environment } from '../../environments/environment';
import { PotatoConnect } from './walletkit';
import { from, map, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { SessionTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

@Component({
  selector: 'app-potato',
  imports: [AsyncPipe],
  templateUrl: './potato.html',
  styleUrls: ['./potato.css'],
})
export class Potato implements OnInit {
  tokenId = input.required<string>();
  potato = computed(() => hotPotato(this.tokenId()));
  publicKey = computed(() => publicKey(this.potato()));
  ethAddress = computed(() => computeAddress(this.publicKey()));

  potatoConnectPromise = computed(async () => {
    // TODO: Use separate storage key for each Potato.
    // TODO: Properly take care of the lifecycle of WalletKit. Unsubscribe on destroy etc.
    // TODO: Move into the sdk
    const core = new Core({
      projectId: environment.walletKit.projectId,
    });
    console.log(`Initializing WalletKit for Potato ${this.tokenId()}`);
    return WalletKit.init({
      core,
      metadata: {
        // TODO: Add potato ID
        name: "Hot Potatoes",
        description: "Hot Potatoes Wallet",
        url: "https://github.com/marceljuenemann/hot-potato",
        icons: [],
      },
    }).then((walletKit) => new PotatoConnect(walletKit, this.potato()));
  });

  /**
   * Signal of an Observable of active PotatoConnectSessions.
   */
  sessions$ = computed(() => {
    return from(this.potatoConnectPromise()).pipe(
      switchMap(potatoConnect => potatoConnect.session$),
    );
  });


  private walletKit: IWalletKit | null = null;

  async ngOnInit() {

  }

  async connectWalletConnect(url: string) {
    if (!this.walletKit) throw new Error('WalletKit not initialized');
    if (!url?.trim()) return;

    try {
      await this.walletKit.pair({ uri: url.trim() });
    } catch (e) {
      console.error('Error connecting WalletConnect:', e);
    }
  }

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
