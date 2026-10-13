import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.checkBootstrapStatus().pipe(
    switchMap(isBootstrapped => {
      if (!isBootstrapped) {
        router.navigate(['/bootstrap']);
        return [false];
      }

      if (auth.currentUser()) {
        return [true];
      }

      return auth.loadCurrentUser().pipe(
        map(user => {
          if (user) return true;
          router.navigate(['/login']);
          return false;
        })
      );
    })
  );
};
