import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = route.data['permission'] as string | undefined;
  if (!required) return true;
  const user = auth.getUser();
  const perms = user?.permissions ?? [];
  if (perms.includes('*') || perms.includes(required)) return true;
  return router.navigate(['/admin/dashboard']);
};
