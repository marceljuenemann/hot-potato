import { Component, computed, input } from '@angular/core';
import { computeAddress } from 'ethers';
import { hotPotato, publicKey } from 'potato-sdk';

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
}
