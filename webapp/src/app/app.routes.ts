import { Routes } from '@angular/router';
import { Potato } from './potato/potato';

export const routes: Routes = [
	{ path: 'hot/:tokenId', component: Potato }
];
