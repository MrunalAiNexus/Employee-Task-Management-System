import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div
        *ngFor="let toast of notify.toasts()"
        [ngClass]="{
          'bg-emerald-50 border-emerald-500 text-emerald-900': toast.type === 'success',
          'bg-rose-50 border-rose-500 text-rose-900': toast.type === 'error',
          'bg-amber-50 border-amber-500 text-amber-900': toast.type === 'warning',
          'bg-blue-50 border-blue-500 text-blue-900': toast.type === 'info'
        }"
        class="pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-lg transition-all duration-200 animate-fade-in"
      >
        <div class="flex items-start gap-3">
          <span class="text-lg">
            <ng-container [ngSwitch]="toast.type">
              <span *ngSwitchCase="'success'">✓</span>
              <span *ngSwitchCase="'error'">✕</span>
              <span *ngSwitchCase="'warning'">⚠</span>
              <span *ngSwitchDefault>ℹ</span>
            </ng-container>
          </span>
          <p class="text-sm font-medium leading-snug">{{ toast.text }}</p>
        </div>
        <button
          type="button"
          (click)="notify.removeToast(toast.id)"
          class="text-xs opacity-60 hover:opacity-100 ml-2 font-bold px-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
    }
  `]
})
export class ToastContainerComponent {
  notify = inject(NotificationService);
}
