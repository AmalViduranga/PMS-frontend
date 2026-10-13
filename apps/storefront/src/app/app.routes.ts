import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalogue'
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./features/catalogue/catalogue.component').then(m => m.CatalogueComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/order-tracking.component').then(m => m.OrderTrackingComponent)
  },
  {
    path: '**',
    redirectTo: 'catalogue'
  }
];
