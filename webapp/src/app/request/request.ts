import { Component, input, signal } from '@angular/core';
import { PotatoConnectRequest } from '../walletkit/walletkit';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { fetchAuthorization } from '../../../../sdk/dist/authorization';

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

  authorization = signal<TriState<string>>({});



  /**
   * Prompts the user to enter a transaction ID for the authorization.
   */
  async promptTransactionHash() {
    const txHash = prompt('Hash of the transaction that authorized the signature:');
    if (!txHash) return;

    this.authorization.set({ progress: 'Fetching authorization...' });
    try {
      const authorization = await fetchAuthorization(this.request().potato, this.request().hashToSign(), txHash);
      this.authorization.set({ success: authorization });
    } catch (e: any) {
      this.authorization.set({ error: String(e) });
    }

  }
}
