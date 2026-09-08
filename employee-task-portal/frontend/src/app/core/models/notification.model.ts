export type NotificationType = 'TASK_ASSIGNED' | 'STATUS_UPDATED' | 'DUE_SOON' | 'SYSTEM';

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  task_id: number | null;
  task_title?: string | null;
  created_at?: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}
