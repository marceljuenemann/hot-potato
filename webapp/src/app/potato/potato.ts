import { Component, computed, input, OnInit } from '@angular/core';
import { computeAddress, BrowserProvider, keccak256 } from 'ethers';
import { hotPotato, publicKey, invokeSignHash } from 'potato-sdk';

import { Core } from "@walletconnect/core";
import { IWalletKit, WalletKit, WalletKitTypes } from "@reown/walletkit";
import { environment } from '../../environments/environment';
import { buildApprovedNamespaces } from '@walletconnect/utils';

@Component({
  selector: 'app-potato',
  imports: [],
  templateUrl: './potato.html',
  styleUrls: ['./potato.css'],
})
export class Potato implements OnInit {
  tokenId = input.required<string>();
  potato = computed(() => hotPotato(this.tokenId()));
  publicKey = computed(() => publicKey(this.potato()));
  ethAddress = computed(() => computeAddress(this.publicKey()));

  private walletKit: IWalletKit | null = null;

  async ngOnInit() {
    // TODO: Use separate storage key for each Potato.
    // TODO: Properly take care of the lifecycle of WalletKit. Unsubscribe on destroy etc.
    // TODO: Move into the sdk
    const core = new Core({
      projectId: environment.walletKit.projectId,
    });

    this.walletKit = await WalletKit.init({
      core,
      metadata: {
        name: "Hot Potatoes",
        description: "Hot Potatoes Wallet",
        url: "https://github.com/marceljuenemann/hot-potato",
        icons: [],
      },
    });

    this.walletKit.on(
      "session_proposal",
      async (proposal: WalletKitTypes.SessionProposal) => {
        const approvedNamespaces = buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: {
            eip155: {
              // TODO: More chains
              chains: ['eip155:1', 'eip155:137'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: [], // ['accountsChanged', 'chainChanged'],
              accounts: [
                // TODO: Set accounts.
                'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
                'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb'
              ]
            }
          }
        })

        const session = await this.walletKit!.approveSession({
          id: proposal.id,
          namespaces: approvedNamespaces,
        });
      }
    );

    // TODO: Maybe wrap with rxjs and call off methods when unsubscribed
    const sessions = await this.walletKit.getActiveSessions();
    console.log(sessions);
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
