import { Routes } from '@angular/router';
import { Potato } from './potato/potato';
import { LandingPage } from './landing-page/landing-page';

export const routes: Routes = [
  { path: '', component: LandingPage },
	{ path: 'hot/:tokenId', component: Potato }
];
