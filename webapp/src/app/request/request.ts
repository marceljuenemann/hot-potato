import { Component, computed, input, signal } from '@angular/core';
import { PotatoConnectRequest } from '../walletkit/walletkit';
import { NgbAccordionModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Signature, BrowserProvider, TransactionResponse, TransactionLike, keccak256, computeAddress } from 'ethers';
import { Authorization, authorizeSignature, fetchAuthorization, fetchSignature, Potato, publicKey } from 'potato-sdk';
import { TransactionForm } from '../transaction-form/transaction-form';
import { Transaction } from 'ethers';
import { AlchemyProvider } from 'ethers';
import { browserProviderForChain } from '../walletkit/browser';

type TriState<T> = {
  progress?: string;
  success?: T;
  error?: string;
}

@Component({
  selector: 'potato-connect-request',
  imports: [TransactionForm, NgbAccordionModule, NgbDropdownModule, DatePipe],
  templateUrl: './request.html',
  styleUrl: './request.css',
})
export class Request {
  request = input.required<PotatoConnectRequest>();
  requestedTransaction = signal<Transaction | null>(null);
  requestedHash = computed(() => this.hashToSign());

  authorization = signal<TriState<Authorization>>({});
  signature = signal<TriState<Signature>>({});
  broadcast = signal<TriState<string>>({});

  hashToSign(): string | null {
    if (this.request().isPersonalSign) {
      const msg = this.request().personalSignMessage;
      const data = "\x19Ethereum Signed Message:\n" + msg.length + msg;
      return keccak256(new TextEncoder().encode(data));
    } else if (this.requestedTransaction()) {
      return this.requestedTransaction()!.unsignedHash;
    }
    return null;
  }

  /**
   * Invokes the MetaMask to authorize the signature.
   */
  async authorizeSignature() {
    const hash = this.requestedHash();
    if (!hash) return;
    const potato = this.request().potato;
    const provider = await browserProviderForChain(potato.chainId);
    const signer = await provider.getSigner();
    const transaction = await authorizeSignature(potato, hash, signer);
    this.fetchAuthorization(potato, hash, transaction);
  }

  /**
   * Prompts the user to manually enter a transaction hash for the authorization.
   */
  promptTransactionHash() {
    const txHash = prompt('Hash of the transaction that authorized the signature:');
    if (txHash) {
      this.fetchAuthorization(this.request().potato, this.requestedHash()!, txHash);
    }
  }

  async fetchAuthorization(potato: Potato, hash: string, transaction: string | TransactionResponse) {
    this.authorization.set({ progress: 'Waiting for transaction receipt...' });
    try {
      const authorization = await fetchAuthorization(potato, hash, transaction);
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
    this.signature.set({ progress: 'Creating signature on Internet Computer...' });
    try {
      const signature = await fetchSignature(this.request().potato, authorization);
      this.signature.set({ success: signature });
      if (this.request().isPersonalSign) {
        this.request().respond(signature.serialized);
      } else {
        this.broadcastTransaction(signature);
      }
    } catch (e: any) {
      this.signature.set({ error: String(e) });
    }
  }

  async broadcastTransaction(signature: Signature) {
    // TODO: User might change the transaction in the meantime. Bad user!
    this.broadcast.set({ progress: 'Broadcasting transaction...' });
    try {
      const transaction = this.requestedTransaction()!;
      //transaction.from = computeAddress(publicKey(this.request().potato));
      transaction.signature = signature;
      console.log("Broadcasting transaction:", transaction);

      const provider = new AlchemyProvider(transaction.chainId);
      const response = await provider.broadcastTransaction(transaction.serialized);
      this.request().respond(response.hash);
      this.broadcast.set({ success: response.hash });
    } catch (e) {
      this.broadcast.set({ error: String(e) })
    }
  }
}
