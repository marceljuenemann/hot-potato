import { Component, input } from '@angular/core';
import { PotatoConnectRequest } from '../walletkit/walletkit';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'potato-connect-request',
  imports: [NgbAccordionModule],
  templateUrl: './request.html',
  styleUrl: './request.css',
})
export class Request {
  request = input.required<PotatoConnectRequest>();


}
