import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      <!-- Global Toast Alerts -->
      <app-toast-container></app-toast-container>

      <!-- Navigation Header (Shown when logged in) -->
      <app-navbar *ngIf="auth.isAuthenticated()"></app-navbar>

      <!-- Main Router Outlet Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer *ngIf="auth.isAuthenticated()" class="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        Employee Task Management Portal &copy; 2026 • Role-Based Access Control & Notification Engine
      </footer>
    </div>
  `
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  notify = inject(NotificationService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.notify.startPolling();
    }
  }
}
