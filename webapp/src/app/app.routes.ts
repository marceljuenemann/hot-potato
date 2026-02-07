import { Routes } from '@angular/router';
import { Potato } from './potato/potato';
import { LandingPage } from './landing-page/landing-page';
import { Uniswapx } from './uniswapx/uniswapx';

export const routes: Routes = [
  { path: '', component: LandingPage },
	{ path: 'hot/:tokenId', component: Potato },
  { path: 'uniswapx', component: Uniswapx }
];
