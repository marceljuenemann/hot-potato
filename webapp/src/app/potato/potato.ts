import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-potato',
  imports: [],
  templateUrl: './potato.html',
  styleUrl: './potato.css',
})
export class Potato {
  tokenId: string | null;

  constructor(private readonly route: ActivatedRoute) {
    this.tokenId = this.route.snapshot.paramMap.get('tokenId');
  }
}
