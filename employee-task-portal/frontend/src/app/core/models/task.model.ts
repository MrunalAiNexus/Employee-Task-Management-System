export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: number;
  title: string;
  description: string;
  employee_id: number | null;
  employee_name?: string | null;
  employee_email?: string | null;
  department?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  employee_id?: number | null;
  priority: TaskPriority;
  status?: TaskStatus;
  due_date: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  employee_id?: number;
}
