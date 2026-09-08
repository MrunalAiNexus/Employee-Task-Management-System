import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const expectedRole = route.data?.['role'] as string;
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (expectedRole && user.role !== expectedRole) {
    notify.error(`Access Restricted: This area requires ${expectedRole} privileges.`);
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
