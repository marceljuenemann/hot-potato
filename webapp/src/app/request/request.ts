import { Component, input, signal } from '@angular/core';
import { PotatoConnectRequest } from '../walletkit/walletkit';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Signature, BrowserProvider, TransactionResponse } from 'ethers';
import { Authorization, authorizeSignature, fetchAuthorization, fetchSignature } from 'potato-sdk';

type TriState<T> = {
  progress?: string;
  success?: T;
  error?: string;
}

@Component({
  selector: 'potato-connect-request',
  imports: [NgbAccordionModule, DatePipe],
  templateUrl: './request.html',
  styleUrl: './request.css',
})
export class Request {
  request = input.required<PotatoConnectRequest>();

  authorization = signal<TriState<Authorization>>({});
  signature = signal<TriState<Signature>>({});

  /**
   * Invokes the MetaMask to authorize the signature.
   */
  async authorizeSignature() {
    const potato = this.request().potato;
    const provider = await this.providerForChain(potato.chainId);
    const signer = await provider.getSigner();
    const transaction = await authorizeSignature(potato, this.request().hashToSign(), signer);
    this.fetchAuthorization(transaction);
  }

  /**
   * Prompts the user to manually enter a transaction hash for the authorization.
   */
  promptTransactionHash() {
    const txHash = prompt('Hash of the transaction that authorized the signature:');
    if (txHash) {
      this.fetchAuthorization(txHash);
    }
  }

  async fetchAuthorization(transaction: string | TransactionResponse) {
    this.authorization.set({ progress: 'Waiting for transaction receipt...' });
    try {
      const authorization = await fetchAuthorization(this.request().potato, this.request().hashToSign(), transaction);
      if (!authorization) {
        this.authorization.set({ error: 'No valid authorization in the transaction receipt.' });
        return;
      }
      this.authorization.set({ success: authorization });
      this.fetchSignature(authorization);
    } catch (e: any) {
      this.authorization.set({ error: String(e) });
    }
  }

  async fetchSignature(authorization: Authorization) {
    this.signature.set({ progress: 'Fetching signature from Internet Computer...' });
    try {
      const signature = await fetchSignature(this.request().potato, authorization);
      this.signature.set({ success: signature });
      this.request().respond(signature);
    } catch (e: any) {
      this.signature.set({ error: String(e) });
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
