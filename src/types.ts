export type UserRole = 'admin' | 'user';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export type NotificationType = 'TASK_ASSIGNED' | 'STATUS_UPDATED' | 'DUE_SOON' | 'SYSTEM';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  employee_id?: number | null;
  password_hash?: string;
  salt?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  tasks_count?: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  employee_id: number;
  employee_name?: string;
  department?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  created_at?: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  task_id?: number | null;
  task_title?: string | null;
  created_at: string;
}

export interface ToastAlert {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
