import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
            EP
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Task Management Portal</h1>
          <p class="text-sm text-slate-500">Sign in to manage employees, assignments, and tasks</p>
        </div>

        <!-- Role Quick Fill Presets -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Quick Demo Login</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="quickFill('admin', 'Admin@123')"
              class="flex flex-col items-center p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left"
            >
              <span class="text-xs font-bold text-slate-900">Administrator</span>
              <span class="text-[10px] text-slate-500">Full Access</span>
            </button>

            <button
              type="button"
              (click)="quickFill('alice', 'Alice@123')"
              class="flex flex-col items-center p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
            >
              <span class="text-xs font-bold text-slate-900">Employee (User)</span>
              <span class="text-[10px] text-slate-500">My Tasks Only</span>
            </button>
          </div>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-semibold uppercase text-slate-700 mb-1">Username or Email</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="e.g. admin or alice"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p *ngIf="loginForm.get('username')?.touched && loginForm.get('username')?.invalid" class="text-rose-600 text-xs mt-1">
              Username or email is required.
            </p>
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold uppercase text-slate-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="text-rose-600 text-xs mt-1">
              Password must be at least 6 characters.
            </p>
          </div>

          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span *ngIf="isLoading()" class="animate-spin text-xs">⏳</span>
            <span>{{ isLoading() ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  quickFill(username: string, pass: string) {
    this.loginForm.patchValue({
      username,
      password: pass
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const { username, password } = this.loginForm.value;

    this.auth.login({ username, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const user = res.data?.user;
        this.notify.success(`Welcome back, ${user?.username || 'User'}!`);
        this.notify.startPolling();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Login failed. Please verify credentials.';
        this.notify.error(msg);
      }
    });
  }
}
