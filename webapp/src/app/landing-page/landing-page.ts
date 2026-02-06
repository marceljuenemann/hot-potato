import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PotatoIcon } from '../potato-icon/potato-icon';
import { browserProviderForChain } from '../walletkit/browser';
import { HotPotato } from 'potato-sdk';

@Component({
  selector: 'app-landing-page',
  imports: [PotatoIcon],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {

  constructor(private readonly router: Router) {}

  async mint() {
    const provider = await browserProviderForChain(new HotPotato(0n).chainId);
    const signer = await provider.getSigner();
    const potato = await HotPotato.mint(signer);

    if (potato) {
      console.log("Minted potato", potato);
      await this.router.navigate(['/hot', potato.tokenId.toString()]);
    }
  }
}
