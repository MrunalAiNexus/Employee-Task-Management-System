import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification, NotificationsResponse } from '../models/notification.model';
import { ApiResponse } from '../models/api-response.model';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  // In-app Toast alerts
  private currentToasts = signal<ToastMessage[]>([]);
  public toasts = this.currentToasts.asReadonly();
  private nextToastId = 1;

  // Persistent server notifications
  private notificationsList = signal<AppNotification[]>([]);
  public notifications = this.notificationsList.asReadonly();

  private unreadCounter = signal<number>(0);
  public unreadCount = this.unreadCounter.asReadonly();

  private pollingIntervalId: any = null;

  constructor(private http: HttpClient) {}

  // --- In-App Toast System ---
  success(text: string, durationMs = 4000) {
    this.addToast('success', text, durationMs);
  }

  error(text: string, durationMs = 5000) {
    this.addToast('error', text, durationMs);
  }

  info(text: string, durationMs = 4000) {
    this.addToast('info', text, durationMs);
  }

  warning(text: string, durationMs = 4500) {
    this.addToast('warning', text, durationMs);
  }

  removeToast(id: number) {
    this.currentToasts.update(list => list.filter(t => t.id !== id));
  }

  private addToast(type: 'success' | 'error' | 'info' | 'warning', text: string, durationMs: number) {
    const id = this.nextToastId++;
    const item: ToastMessage = { id, type, text };
    this.currentToasts.update(list => [...list, item]);

    setTimeout(() => {
      this.removeToast(id);
    }, durationMs);
  }

  // --- Backend Notification Center API ---
  fetchNotifications(): Observable<ApiResponse<NotificationsResponse>> {
    return this.http.get<ApiResponse<NotificationsResponse>>(this.apiUrl).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const prevCount = this.unreadCounter();
          this.notificationsList.set(res.data.notifications || []);
          this.unreadCounter.set(res.data.unread_count || 0);

          // If new unread notifications arrived while viewing, display a toast notification alert!
          if (prevCount > 0 && res.data.unread_count > prevCount) {
            const latest = res.data.notifications[0];
            if (latest && !latest.is_read) {
              this.info(`🔔 ${latest.title}: ${latest.message}`);
            }
          }
        }
      })
    );
  }

  markAsRead(notificationId: number): Observable<ApiResponse<{ notification: AppNotification; unread_count: number }>> {
    return this.http.patch<ApiResponse<{ notification: AppNotification; unread_count: number }>>(
      `${this.apiUrl}/${notificationId}/read`,
      {}
    ).pipe(
      tap((res) => {
        if (res.success) {
          this.notificationsList.update(list =>
            list.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
          );
          this.unreadCounter.update(c => Math.max(0, c - 1));
        }
      })
    );
  }

  markAllAsRead(): Observable<ApiResponse<{ unread_count: number }>> {
    return this.http.post<ApiResponse<{ unread_count: number }>>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap((res) => {
        if (res.success) {
          this.notificationsList.update(list => list.map(n => ({ ...n, is_read: true })));
          this.unreadCounter.set(0);
          this.success('All notifications marked as read.');
        }
      })
    );
  }

  deleteNotification(notificationId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${notificationId}`).pipe(
      tap((res) => {
        if (res.success) {
          const removed = this.notificationsList().find(n => n.id === notificationId);
          this.notificationsList.update(list => list.filter(n => n.id !== notificationId));
          if (removed && !removed.is_read) {
            this.unreadCounter.update(c => Math.max(0, c - 1));
          }
        }
      })
    );
  }

  startPolling(intervalMs = 30000) {
    this.stopPolling();
    this.fetchNotifications().subscribe({ error: () => {} });
    this.pollingIntervalId = setInterval(() => {
      this.fetchNotifications().subscribe({ error: () => {} });
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }
}
