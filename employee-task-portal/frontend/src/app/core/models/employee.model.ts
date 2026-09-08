import { Task } from './task.model';

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  tasks_count?: number;
  tasks?: Task[];
}

export interface CreateEmployeeDto {
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {}
