import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
            <span
              [ngClass]="{
                'bg-blue-100 text-blue-700': auth.isAdmin(),
                'bg-emerald-100 text-emerald-700': !auth.isAdmin()
              }"
              class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            >
              {{ auth.isAdmin() ? 'Full Administrator Access' : 'My Assigned Work' }}
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-1">
            <span *ngIf="auth.isAdmin()">Create, distribute, track, and reassign organizational tasks</span>
            <span *ngIf="!auth.isAdmin()">View your assigned tasks and update status progress as you complete deliverables</span>
          </p>
        </div>

        <!-- Add Task Button (Admin Only) -->
        <button
          *ngIf="auth.isAdmin()"
          type="button"
          (click)="openCreateModal()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>Create Task</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <!-- Search Input -->
        <div class="relative">
          <input
            type="text"
            [value]="searchFilter()"
            (input)="onSearchInput($event)"
            placeholder="Search tasks..."
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
        </div>

        <!-- Status Filter -->
        <div>
          <select
            [value]="statusFilter()"
            (change)="onStatusFilterChange($event)"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div>
          <select
            [value]="priorityFilter()"
            (change)="onPriorityFilterChange($event)"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="resetFilters()"
            class="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>

      </div>

      <!-- Tasks List / Grid -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <th class="py-3 px-4">Task Details</th>
                <th class="py-3 px-4">Assignee</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4">Status</th>
                <th *ngIf="auth.isAdmin()" class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                *ngFor="let task of tasks()"
                class="hover:bg-slate-50/70 transition-colors"
                [ngClass]="{ 'bg-amber-50/30': isDueSoon(task.due_date) && task.status !== 'Completed' }"
              >
                <!-- Task Title & Description -->
                <td class="py-3.5 px-4 max-w-xs">
                  <div class="font-semibold text-slate-900 leading-snug">{{ task.title }}</div>
                  <div class="text-xs text-slate-500 line-clamp-2 mt-0.5">{{ task.description || 'No description provided' }}</div>
                </td>

                <!-- Assignee -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {{ (task.employee_name || 'U').charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900 text-xs">{{ task.employee_name || 'Unassigned' }}</p>
                      <p class="text-[10px] text-slate-400">{{ task.department || 'General' }}</p>
                    </div>
                  </div>
                </td>

                <!-- Priority -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span
                    [ngClass]="{
                      'bg-rose-100 text-rose-700 border border-rose-200': task.priority === 'High',
                      'bg-amber-100 text-amber-800 border border-amber-200': task.priority === 'Medium',
                      'bg-blue-100 text-blue-700 border border-blue-200': task.priority === 'Low'
                    }"
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-block"
                  >
                    {{ task.priority }}
                  </span>
                </td>

                <!-- Due Date with 24h Due Soon Alert -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-xs font-medium text-slate-800">{{ task.due_date }}</span>
                    <span
                      *ngIf="isDueSoon(task.due_date) && task.status !== 'Completed'"
                      class="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5"
                    >
                      <span>⏰</span> Due Soon!
                    </span>
                  </div>
                </td>

                <!-- Status Updater -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <!-- Employees and Admins can update status directly -->
                  <select
                    [value]="task.status"
                    (change)="updateStatus(task, $event)"
                    [ngClass]="{
                      'bg-amber-50 text-amber-800 border-amber-300': task.status === 'Pending',
                      'bg-blue-50 text-blue-800 border-blue-300': task.status === 'In Progress',
                      'bg-emerald-50 text-emerald-800 border-emerald-300': task.status === 'Completed'
                    }"
                    class="text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>

                <!-- Actions (Admin Only) -->
                <td *ngIf="auth.isAdmin()" class="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    (click)="openEditModal(task)"
                    class="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    (click)="confirmDelete(task)"
                    class="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="tasks().length === 0 && !isLoading()">
                <td [attr.colspan]="auth.isAdmin() ? 6 : 5" class="py-12 text-center text-slate-400 text-sm">
                  No tasks found matching your filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Task Modal (Admin Create / Edit) -->
      <div
        *ngIf="showModal()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              {{ editingTask() ? 'Edit Task Details' : 'Create New Task' }}
            </h3>
            <button
              type="button"
              (click)="closeModal()"
              class="text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>
          </div>

          <form [formGroup]="taskForm" (ngSubmit)="saveTask()" class="space-y-4">
            <div>
              <label for="taskTitle" class="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
              <input
                id="taskTitle"
                type="text"
                formControlName="title"
                placeholder="e.g. Audit security compliance"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p *ngIf="taskForm.get('title')?.touched && taskForm.get('title')?.invalid" class="text-rose-600 text-xs mt-1">
                Title is required (minimum 3 characters).
              </p>
            </div>

            <div>
              <label for="taskDesc" class="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                id="taskDesc"
                rows="3"
                formControlName="description"
                placeholder="Provide task expectations and notes..."
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <!-- Assignee select -->
              <div>
                <label for="taskEmp" class="block text-xs font-semibold text-slate-700 mb-1">Assign Employee</label>
                <select
                  id="taskEmp"
                  formControlName="employee_id"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white focus:outline-none"
                >
                  <option [ngValue]="null">-- Select Assignee --</option>
                  <option *ngFor="let emp of employeesList()" [value]="emp.id">
                    {{ emp.name }} ({{ emp.department }})
                  </option>
                </select>
                <p *ngIf="taskForm.get('employee_id')?.touched && taskForm.get('employee_id')?.invalid" class="text-rose-600 text-xs mt-1">
                  Assignee is required.
                </p>
              </div>

              <!-- Priority -->
              <div>
                <label for="taskPri" class="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  id="taskPri"
                  formControlName="priority"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white focus:outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <!-- Due Date -->
              <div>
                <label for="taskDue" class="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  id="taskDue"
                  type="date"
                  formControlName="due_date"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p *ngIf="taskForm.get('due_date')?.touched && taskForm.get('due_date')?.invalid" class="text-rose-600 text-xs mt-1">
                  Due date is required.
                </p>
              </div>

              <!-- Status (if editing) -->
              <div>
                <label for="taskStatus" class="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                <select
                  id="taskStatus"
                  formControlName="status"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="taskForm.invalid || isSubmitting()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {{ isSubmitting() ? 'Saving...' : 'Save Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class TaskListComponent implements OnInit {
  taskService = inject(TaskService);
  empService = inject(EmployeeService);
  auth = inject(AuthService);
  notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  tasks = signal<Task[]>([]);
  employeesList = signal<Employee[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  searchFilter = signal<string>('');
  statusFilter = signal<string>('');
  priorityFilter = signal<string>('');

  showModal = signal<boolean>(false);
  editingTask = signal<Task | null>(null);

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    employee_id: [null, [Validators.required]],
    priority: ['Medium', [Validators.required]],
    due_date: ['', [Validators.required]],
    status: ['Pending', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadTasks();
    if (this.auth.isAdmin()) {
      this.loadEmployeesList();
    }
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new' && this.auth.isAdmin()) {
        this.openCreateModal();
      }
    });
  }

  loadEmployeesList() {
    this.empService.getEmployees().subscribe({
      next: (res) => this.employeesList.set(res.data || [])
    });
  }

  loadTasks() {
    this.isLoading.set(true);
    this.taskService.getTasks({
      search: this.searchFilter(),
      status: this.statusFilter(),
      priority: this.priorityFilter()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.tasks.set(res.data || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify.error(err.error?.message || 'Failed to load tasks.');
      }
    });
  }

  onSearchInput(event: Event) {
    this.searchFilter.set((event.target as HTMLInputElement).value);
    this.loadTasks();
  }

  onStatusFilterChange(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.loadTasks();
  }

  onPriorityFilterChange(event: Event) {
    this.priorityFilter.set((event.target as HTMLSelectElement).value);
    this.loadTasks();
  }

  resetFilters() {
    this.searchFilter.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.loadTasks();
  }

  isDueSoon(dueDateStr: string): boolean {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  updateStatus(task: Task, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value as TaskStatus;
    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      next: () => {
        this.notify.success(`Status for "${task.title}" updated to ${newStatus}`);
        this.loadTasks();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to update status.');
        this.loadTasks();
      }
    });
  }

  openCreateModal() {
    this.editingTask.set(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const defaultDue = tomorrow.toISOString().split('T')[0];

    this.taskForm.reset({
      title: '',
      description: '',
      employee_id: this.employeesList()[0]?.id || null,
      priority: 'Medium',
      due_date: defaultDue,
      status: 'Pending'
    });
    this.showModal.set(true);
  }

  openEditModal(task: Task) {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      employee_id: task.employee_id,
      priority: task.priority,
      due_date: task.due_date,
      status: task.status
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask() {
    if (this.taskForm.invalid) return;

    this.isSubmitting.set(true);
    const val = this.taskForm.value;
    const current = this.editingTask();

    if (current) {
      this.taskService.updateTask(current.id, val).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          const title = res.data?.title || val.title;
          this.notify.success(`Task "${title}" updated successfully.`);
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.message || 'Failed to update task.');
        }
      });
    } else {
      this.taskService.createTask(val).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          const title = res.data?.title || val.title;
          this.notify.success(`Task "${title}" created and assigned.`);
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.message || 'Failed to create task.');
        }
      });
    }
  }

  confirmDelete(task: Task) {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.notify.success(`Task "${task.title}" deleted.`);
          this.loadTasks();
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Failed to delete task.');
        }
      });
    }
  }
}
