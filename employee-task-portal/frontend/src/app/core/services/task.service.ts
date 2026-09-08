import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskFilterParams } from '../models/task.model';
import { ApiResponse } from '../models/api-response.model';

export interface DashboardStats {
  role?: string;
  total_employees: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  priority_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  department_distribution: { department: string; count: number }[];
  recent_tasks: Task[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;
  private dashboardUrl = `${environment.apiUrl}/dashboard/stats`;

  constructor(private http: HttpClient) {}

  getTasks(filter?: TaskFilterParams): Observable<ApiResponse<Task[]>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.search?.trim()) params = params.set('search', filter.search.trim());
      if (filter.status?.trim()) params = params.set('status', filter.status.trim());
      if (filter.priority?.trim()) params = params.set('priority', filter.priority.trim());
      if (filter.employee_id) params = params.set('employee_id', filter.employee_id.toString());
    }
    return this.http.get<ApiResponse<Task[]>>(this.apiUrl, { params });
  }

  getTaskById(id: number): Observable<ApiResponse<Task>> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`);
  }

  createTask(payload: CreateTaskDto): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, payload);
  }

  updateTask(id: number, payload: UpdateTaskDto): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, payload);
  }

  updateTaskStatus(id: number, status: TaskStatus): Observable<ApiResponse<Task>> {
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteTask(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(this.dashboardUrl);
  }
}
