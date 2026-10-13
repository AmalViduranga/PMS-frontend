import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'bootstrap',
    loadComponent: () => import('./features/auth/bootstrap.component').then(m => m.BootstrapComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'catalogue',
        loadComponent: () => import('./features/catalogue/catalogue.component').then(m => m.CatalogueComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./features/prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent)
      },
      {
        path: 'purchasing',
        loadComponent: () => import('./features/purchasing/purchasing.component').then(m => m.PurchasingComponent)
      },
      {
        path: 'returns',
        loadComponent: () => import('./features/returns/returns.component').then(m => m.ReturnsComponent)
      },
      {
        path: 'workforce',
        loadComponent: () => import('./features/workforce/workforce.component').then(m => m.WorkforceComponent)
      },
      {
        path: 'reporting',
        loadComponent: () => import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
      },
      {
        path: 'branches',
        loadComponent: () => import('./features/branches/branches.component').then(m => m.BranchesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
