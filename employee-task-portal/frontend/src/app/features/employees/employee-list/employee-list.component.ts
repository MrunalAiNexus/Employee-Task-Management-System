import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
            <span class="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Admin Only</span>
          </div>
          <p class="text-sm text-slate-500 mt-1">Manage personnel records, departments, and work assignments</p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>Add Employee</span>
        </button>
      </div>

      <!-- Controls & Search Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-96">
          <input
            type="text"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            placeholder="Search employees by name, email, department, or role..."
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
        </div>

        <div class="text-xs font-medium text-slate-500 w-full sm:w-auto text-right">
          Total: <span class="font-bold text-slate-900">{{ employees().length }}</span> employee(s)
        </div>
      </div>

      <!-- Employee Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <th class="py-3 px-4">Employee</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Role / Title</th>
                <th class="py-3 px-4 text-center">Assigned Tasks</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let emp of employees()" class="hover:bg-slate-50/60 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="font-semibold text-slate-900">{{ emp.name }}</div>
                  <div class="text-xs text-slate-500">{{ emp.email }}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {{ emp.department }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-700 font-medium">
                  {{ emp.role }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    [ngClass]="{
                      'bg-blue-50 text-blue-700 font-bold': (emp.tasks_count || 0) > 0,
                      'bg-slate-100 text-slate-500': !emp.tasks_count
                    }"
                    class="px-2.5 py-0.5 rounded-full text-xs inline-block"
                  >
                    {{ emp.tasks_count || 0 }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right space-x-2">
                  <button
                    type="button"
                    (click)="openEditModal(emp)"
                    class="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    (click)="confirmDelete(emp)"
                    class="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>

              <tr *ngIf="employees().length === 0 && !isLoading()">
                <td colspan="5" class="py-12 text-center text-slate-400 text-sm">
                  No employees found matching your criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Employee Modal (Create / Edit) -->
      <div
        *ngIf="showModal()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">
              {{ editingEmployee() ? 'Edit Employee Record' : 'Create New Employee' }}
            </h3>
            <button
              type="button"
              (click)="closeModal()"
              class="text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>
          </div>

          <form [formGroup]="empForm" (ngSubmit)="saveEmployee()" class="space-y-4">
            <div>
              <label for="empName" class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                id="empName"
                type="text"
                formControlName="name"
                placeholder="e.g. Sarah Jenkins"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p *ngIf="empForm.get('name')?.touched && empForm.get('name')?.invalid" class="text-rose-600 text-xs mt-1">
                Name is required (at least 2 chars).
              </p>
            </div>

            <div>
              <label for="empEmail" class="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                id="empEmail"
                type="email"
                formControlName="email"
                placeholder="e.g. sarah@portal.com"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p *ngIf="empForm.get('email')?.touched && empForm.get('email')?.invalid" class="text-rose-600 text-xs mt-1">
                Valid email address is required.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="empDept" class="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  id="empDept"
                  type="text"
                  formControlName="department"
                  placeholder="e.g. Engineering"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label for="empRole" class="block text-xs font-semibold text-slate-700 mb-1">Role / Job Title</label>
                <input
                  id="empRole"
                  type="text"
                  formControlName="role"
                  placeholder="e.g. DevOps Engineer"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                [disabled]="empForm.invalid || isSubmitting()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {{ isSubmitting() ? 'Saving...' : 'Save Employee' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class EmployeeListComponent implements OnInit {
  private empService = inject(EmployeeService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  employees = signal<Employee[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  searchTerm = signal<string>('');

  showModal = signal<boolean>(false);
  editingEmployee = signal<Employee | null>(null);

  empForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', [Validators.required]],
    role: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadEmployees();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openCreateModal();
      }
    });
  }

  loadEmployees(search?: string) {
    this.isLoading.set(true);
    this.empService.getEmployees(search).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.employees.set(res.data || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify.error(err.error?.message || 'Failed to load employees.');
      }
    });
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.loadEmployees(val);
  }

  openCreateModal() {
    this.editingEmployee.set(null);
    this.empForm.reset({
      name: '',
      email: '',
      department: 'Engineering',
      role: 'Staff'
    });
    this.showModal.set(true);
  }

  openEditModal(emp: Employee) {
    this.editingEmployee.set(emp);
    this.empForm.patchValue({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingEmployee.set(null);
  }

  saveEmployee() {
    if (this.empForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.empForm.value;
    const current = this.editingEmployee();

    if (current) {
      // Update
      this.empService.updateEmployee(current.id, formValue).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          const name = res.data?.name || formValue.name;
          this.notify.success(`Employee "${name}" updated successfully.`);
          this.closeModal();
          this.loadEmployees(this.searchTerm());
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.message || 'Update failed.');
        }
      });
    } else {
      // Create
      this.empService.createEmployee(formValue).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          const name = res.data?.name || formValue.name;
          this.notify.success(`Employee "${name}" created successfully.`);
          this.closeModal();
          this.loadEmployees(this.searchTerm());
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.message || 'Creation failed.');
        }
      });
    }
  }

  confirmDelete(emp: Employee) {
    if (confirm(`Are you sure you want to delete employee "${emp.name}"? Assigned tasks will be unassigned.`)) {
      this.empService.deleteEmployee(emp.id).subscribe({
        next: () => {
          this.notify.success(`Employee "${emp.name}" deleted.`);
          this.loadEmployees(this.searchTerm());
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Delete failed.');
        }
      });
    }
  }
}
