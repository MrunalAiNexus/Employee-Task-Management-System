import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <!-- Left: Logo & Main Navigation -->
        <div class="flex items-center gap-8">
          <a routerLink="/dashboard" class="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight text-lg">
            <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm shadow-blue-500/20">
              EP
            </div>
            <span>Task<span class="text-blue-600">Portal</span></span>
          </a>

          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-slate-100 text-blue-700 font-semibold"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3.5 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </a>

            <a
              routerLink="/tasks"
              routerLinkActive="bg-slate-100 text-blue-700 font-semibold"
              class="px-3.5 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Tasks
            </a>

            <!-- Employees: ADMIN ONLY -->
            <a
              *ngIf="auth.isAdmin()"
              routerLink="/employees"
              routerLinkActive="bg-slate-100 text-blue-700 font-semibold"
              class="px-3.5 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Employees
            </a>
          </nav>
        </div>

        <!-- Right: Notification Center & User Profile -->
        <div class="flex items-center gap-3">
          
          <!-- Notification Bell Dropdown -->
          <div class="relative notification-menu-container">
            <button
              type="button"
              (click)="toggleNotifications()"
              class="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              title="Notifications"
              aria-label="View notifications"
            >
              <!-- Bell Icon SVG -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              <!-- Unread Badge -->
              <span
                *ngIf="notify.unreadCount() > 0"
                class="absolute top-1 right-1 flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white animate-pulse"
              >
                {{ notify.unreadCount() > 99 ? '99+' : notify.unreadCount() }}
              </span>
            </button>

            <!-- Notifications Flyout -->
            <div
              *ngIf="isNotifOpen()"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in"
            >
              <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900">Notifications</span>
                  <span
                    *ngIf="notify.unreadCount() > 0"
                    class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                  >
                    {{ notify.unreadCount() }} unread
                  </span>
                </div>
                <button
                  *ngIf="notify.unreadCount() > 0"
                  type="button"
                  (click)="markAllAsRead()"
                  class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Mark all read
                </button>
              </div>

              <!-- Notifications list -->
              <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                <div
                  *ngFor="let item of notify.notifications()"
                  (click)="onNotificationClick(item)"
                  [ngClass]="{ 'bg-blue-50/40': !item.is_read }"
                  class="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors relative flex items-start gap-3"
                >
                  <!-- Status Indicator Icon -->
                  <div class="mt-0.5 shrink-0">
                    <span
                      [ngClass]="{
                        'bg-blue-100 text-blue-700': item.type === 'TASK_ASSIGNED',
                        'bg-purple-100 text-purple-700': item.type === 'STATUS_UPDATED',
                        'bg-amber-100 text-amber-800': item.type === 'DUE_SOON',
                        'bg-slate-100 text-slate-700': item.type === 'SYSTEM'
                      }"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    >
                      <ng-container [ngSwitch]="item.type">
                        <span *ngSwitchCase="'TASK_ASSIGNED'">📋</span>
                        <span *ngSwitchCase="'STATUS_UPDATED'">🔄</span>
                        <span *ngSwitchCase="'DUE_SOON'">⏰</span>
                        <span *ngSwitchDefault>💬</span>
                      </ng-container>
                    </span>
                  </div>

                  <!-- Notification Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-semibold text-slate-900 truncate">{{ item.title }}</p>
                      <span *ngIf="!item.is_read" class="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    </div>
                    <p class="text-xs text-slate-600 mt-0.5 line-clamp-2">{{ item.message }}</p>
                    <span class="text-[10px] text-slate-400 mt-1 block">
                      {{ item.created_at | date:'short' }}
                    </span>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="notify.notifications().length === 0" class="p-8 text-center text-slate-500 text-xs">
                  No notifications yet. You're completely caught up!
                </div>
              </div>
            </div>
          </div>

          <!-- User Role & Profile Badge -->
          <div class="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div class="flex flex-col text-right hidden sm:block">
              <span class="text-xs font-semibold text-slate-900 leading-tight">
                {{ auth.currentUser()?.username }}
              </span>
              <span
                [ngClass]="{
                  'text-blue-700 bg-blue-50 border-blue-200': auth.isAdmin(),
                  'text-emerald-700 bg-emerald-50 border-emerald-200': !auth.isAdmin()
                }"
                class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border inline-block mt-0.5 self-end"
              >
                {{ auth.isAdmin() ? 'Admin' : 'Employee' }}
              </span>
            </div>

            <!-- Logout Button -->
            <button
              type="button"
              (click)="logout()"
              class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>

      </div>
    </header>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  notify = inject(NotificationService);
  router = inject(Router);
  private elRef = inject(ElementRef);

  isNotifOpen = signal<boolean>(false);

  toggleNotifications() {
    this.isNotifOpen.update(v => !v);
    if (this.isNotifOpen()) {
      this.notify.fetchNotifications().subscribe();
    }
  }

  markAllAsRead() {
    this.notify.markAllAsRead().subscribe();
  }

  onNotificationClick(item: AppNotification) {
    if (!item.is_read) {
      this.notify.markAsRead(item.id).subscribe();
    }
    this.isNotifOpen.set(false);
    this.router.navigate(['/tasks']);
  }

  logout() {
    this.notify.stopPolling();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elRef.nativeElement.querySelector('.notification-menu-container')?.contains(target)) {
      this.isNotifOpen.set(false);
    }
  }
}
