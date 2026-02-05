import { Component, computed, input, OnInit } from '@angular/core';
import { computeAddress } from 'ethers';
import { getOwner, hotPotato, publicKey } from 'potato-sdk';

import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";
import { environment } from '../../environments/environment';
import { PotatoConnect } from '../walletkit/walletkit';
import { from, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { Request } from '../request/request';
import { PotatoIcon } from '../potato-icon/potato-icon';

@Component({
  selector: 'app-potato',
  imports: [PotatoIcon, AsyncPipe, NgbAccordionModule, Request],
  templateUrl: './potato.html',
  styleUrls: ['./potato.css'],
})
export class Potato {
  tokenId = input.required<string>();
  potato = computed(() => hotPotato(this.tokenId()));
  publicKey = computed(() => publicKey(this.potato()));
  ethAddress = computed(() => computeAddress(this.publicKey()));
  ownerAsync = computed(() => getOwner(this.potato()));

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
      switchMap(potatoConnect => potatoConnect.sessions$),
    );
  });

  async connectWalletConnect(url: string) {
    try {
      (await this.potatoConnectPromise()).walletKit.pair({ uri: url.trim() });
    } catch (e) {
      // TODO: Give feedback
      alert(e);
      console.error('Error connecting WalletConnect:', e);
    }
  }
}
