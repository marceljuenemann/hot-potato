import { Component, input, signal } from '@angular/core';
import { PotatoConnectRequest } from '../walletkit/walletkit';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Authorization, fetchAuthorization, fetchSignature } from 'potato-sdk';

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

  /**
   * Prompts the user to enter a transaction ID for the authorization.
   */
  async promptTransactionHash() {
    const txHash = prompt('Hash of the transaction that authorized the signature:');
    if (!txHash) return;

    this.authorization.set({ progress: 'Fetching authorization...' });
    try {
      const authorization = await fetchAuthorization(this.request().potato, this.request().hashToSign(), txHash);
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
    const potato = this.request().potato;
    // TODO: Remove
    authorization = { ...authorization, signatureId: BigInt(3) };
    const signature = await fetchSignature(potato, authorization);

  }
}
