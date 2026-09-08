import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TaskService, DashboardStats } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { Task, TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      
      <!-- Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {{ auth.isAdmin() ? 'Organizational Dashboard' : 'My Task Agenda' }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            <span *ngIf="auth.isAdmin()">Overview of company-wide task velocity, employee assignments, and priorities.</span>
            <span *ngIf="!auth.isAdmin()">Manage your personal workload, track deadlines, and update progress status.</span>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            *ngIf="auth.isAdmin()"
            routerLink="/tasks"
            [queryParams]="{ action: 'new' }"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>New Task</span>
          </a>

          <a
            *ngIf="auth.isAdmin()"
            routerLink="/employees"
            [queryParams]="{ action: 'new' }"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Employee</span>
          </a>

          <a
            routerLink="/tasks"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            View All Tasks →
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="py-12 text-center text-slate-400">
        <span class="inline-block animate-spin text-2xl">⏳</span>
        <p class="text-xs font-semibold mt-2">Loading metrics...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!isLoading() && stats()" class="space-y-6">
        
        <!-- KPI Metrics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <!-- Metric 1: Total -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {{ auth.isAdmin() ? 'Total Tasks' : 'My Total Tasks' }}
            </p>
            <p class="text-3xl font-extrabold text-slate-900 mt-2">{{ stats()?.total_tasks || 0 }}</p>
            <p class="text-xs text-slate-400 mt-1">Across all categories</p>
          </div>

          <!-- Metric 2: Pending -->
          <div class="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            </div>
            <p class="text-3xl font-extrabold text-amber-900 mt-2">{{ stats()?.pending_tasks || 0 }}</p>
            <p class="text-xs text-amber-600/80 mt-1">Awaiting start</p>
          </div>

          <!-- Metric 3: In Progress -->
          <div class="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</p>
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            </div>
            <p class="text-3xl font-extrabold text-blue-900 mt-2">{{ stats()?.in_progress_tasks || 0 }}</p>
            <p class="text-xs text-blue-600/80 mt-1">Active execution</p>
          </div>

          <!-- Metric 4: Completed -->
          <div class="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</p>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p class="text-3xl font-extrabold text-emerald-900 mt-2">{{ stats()?.completed_tasks || 0 }}</p>
            <p class="text-xs text-emerald-600/80 mt-1">Done & verified</p>
          </div>

        </div>

        <!-- Two Column Layout: Priorities & Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Recent / Active Tasks -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-base text-slate-900">
                  {{ auth.isAdmin() ? 'Recent Tasks' : 'My Upcoming Deadlines' }}
                </h2>
                <p class="text-xs text-slate-500">
                  {{ auth.isAdmin() ? 'Latest tasks across all employees' : 'Quickly update your task statuses below' }}
                </p>
              </div>
              <a routerLink="/tasks" class="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View table →
              </a>
            </div>

            <!-- Task List -->
            <div class="divide-y divide-slate-100">
              <div
                *ngFor="let task of stats()?.recent_tasks"
                class="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-slate-900">{{ task.title }}</span>
                    <!-- Priority badge -->
                    <span
                      [ngClass]="{
                        'bg-rose-100 text-rose-700': task.priority === 'High',
                        'bg-amber-100 text-amber-800': task.priority === 'Medium',
                        'bg-blue-100 text-blue-700': task.priority === 'Low'
                      }"
                      class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500">
                    <span *ngIf="auth.isAdmin()">Assigned to: <strong>{{ task.employee_name || 'Unassigned' }}</strong> • </span>
                    <span>Due: <strong>{{ task.due_date }}</strong></span>
                  </p>
                </div>

                <!-- Status Update Action -->
                <div class="flex items-center gap-2">
                  <select
                    [value]="task.status"
                    (change)="onStatusChange(task, $event)"
                    class="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <!-- Empty state -->
              <div *ngIf="stats()?.recent_tasks?.length === 0" class="py-8 text-center text-slate-400 text-xs">
                No tasks to display yet.
              </div>
            </div>
          </div>

          <!-- Right Col: Priority Breakdown & Department Distribution -->
          <div class="space-y-6">
            
            <!-- Priority Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 class="font-bold text-base text-slate-900">Priority Breakdown</h2>
              
              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-rose-700">High Priority</span>
                    <span class="text-slate-900">{{ stats()?.priority_breakdown?.high || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-rose-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="getPercentage(stats()?.priority_breakdown?.high)"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-amber-700">Medium Priority</span>
                    <span class="text-slate-900">{{ stats()?.priority_breakdown?.medium || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-amber-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="getPercentage(stats()?.priority_breakdown?.medium)"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-blue-700">Low Priority</span>
                    <span class="text-slate-900">{{ stats()?.priority_breakdown?.low || 0 }}</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-blue-500 h-full rounded-full transition-all duration-500"
                      [style.width.%]="getPercentage(stats()?.priority_breakdown?.low)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Department Distribution (Admin Only) -->
            <div *ngIf="auth.isAdmin()" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h2 class="font-bold text-base text-slate-900">Department Overview</h2>
              <div class="divide-y divide-slate-100 text-xs">
                <div
                  *ngFor="let d of stats()?.department_distribution"
                  class="py-2 flex items-center justify-between"
                >
                  <span class="font-medium text-slate-700">{{ d.department }}</span>
                  <span class="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                    {{ d.count }} emp.
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  taskService = inject(TaskService);
  notify = inject(NotificationService);

  isLoading = signal<boolean>(true);
  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.taskService.getDashboardStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.error('Could not load dashboard statistics.');
      }
    });
  }

  getPercentage(count?: number): number {
    const total = this.stats()?.total_tasks || 0;
    if (!total || !count) return 0;
    return Math.round((count / total) * 100);
  }

  onStatusChange(task: Task, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value as TaskStatus;
    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      next: () => {
        this.notify.success(`Updated "${task.title}" status to ${newStatus}`);
        this.loadStats();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to update status.');
        this.loadStats();
      }
    });
  }
}
