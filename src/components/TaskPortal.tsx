import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Shield,
  UserCheck,
  Search,
  Filter,
  Users,
  CheckSquare,
  BarChart3,
  Calendar,
  X,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import {
  User,
  Employee,
  Task,
  AppNotification,
  ToastAlert,
  TaskStatus,
  TaskPriority
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

export interface TaskPortalProps {
  currentUser?: User;
  onLogout?: () => void;
  onUserChange?: (user: User) => void;
}

export default function TaskPortal({
  currentUser: propUser,
  onLogout,
  onUserChange
}: TaskPortalProps = {}) {
  // Current logged in user (Admin or Alice/Bob)
  const [internalUser, setInternalUser] = useState<User>(propUser || INITIAL_USERS[0]);
  const currentUser = propUser || internalUser;
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tasks' | 'employees'>('dashboard');

  // Core state
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // UI state
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [taskSearch, setTaskSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEmpModal, setShowEmpModal] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    employee_id: 1,
    priority: 'Medium' as TaskPriority,
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'Pending' as TaskStatus
  });

  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: 'Software Engineer'
  });

  const isAdmin = currentUser.role === 'admin';
  const unreadCount = notifications.filter(n => n.user_id === currentUser.id && !n.is_read).length;

  // Helper to show toasts
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Switch role handler
  const switchUser = (userId: number) => {
    const target = INITIAL_USERS.find(u => u.id === userId) || INITIAL_USERS[0];
    if (onUserChange) {
      onUserChange(target);
    } else {
      setInternalUser(target);
    }
    setIsNotifOpen(false);
    if (target.role === 'user' && currentTab === 'employees') {
      setCurrentTab('dashboard');
    }
    addToast('info', `Switched session to ${target.username.toUpperCase()} (${target.role === 'admin' ? 'Administrator' : 'Regular Employee'})`);
  };

  // Logout handler
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      addToast('info', 'Logged out of session.');
    }
  };

  // Due soon checker (<= 24 hours)
  const isDueSoon = (dueDateStr: string) => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= -12 && diffHours <= 24;
  };

  // Visible tasks based on RBAC
  const visibleTasks = tasks.filter(task => {
    // Regular employee can ONLY see their assigned tasks
    if (!isAdmin) {
      if (task.employee_id !== currentUser.employee_id) return false;
    }
    // Search query
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      const match = task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        (task.employee_name && task.employee_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    // Status filter
    if (statusFilter && task.status !== statusFilter) return false;
    // Priority filter
    if (priorityFilter && task.priority !== priorityFilter) return false;

    return true;
  });

  // Status update handler (Available to Admin and Assigned Employee)
  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // RBAC check: Regular user cannot update someone else's task
    if (!isAdmin && targetTask.employee_id !== currentUser.employee_id) {
      addToast('error', 'Forbidden: You can only update tasks assigned directly to you.');
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    addToast('success', `Task status changed to "${newStatus}"`);

    // Generate notification for status update
    const newNotif: AppNotification = {
      id: Date.now(),
      user_id: isAdmin ? (INITIAL_USERS.find(u => u.employee_id === targetTask.employee_id)?.id || 2) : 1,
      title: `Status Updated: ${targetTask.title}`,
      message: `${currentUser.username} updated task status to "${newStatus}".`,
      type: 'STATUS_UPDATED',
      is_read: false,
      task_id: taskId,
      task_title: targetTask.title,
      created_at: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Task save handler (Create or Edit - Admin Only)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('error', 'Only administrators have permission to create or edit tasks.');
      return;
    }
    if (!taskForm.title.trim()) {
      addToast('warning', 'Task title is required.');
      return;
    }

    const assignedEmp = employees.find(emp => emp.id === Number(taskForm.employee_id));

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: taskForm.title,
        description: taskForm.description,
        employee_id: Number(taskForm.employee_id),
        employee_name: assignedEmp?.name || 'Unassigned',
        department: assignedEmp?.department || 'General',
        priority: taskForm.priority,
        due_date: taskForm.due_date,
        status: taskForm.status
      } : t));
      addToast('success', `Task "${taskForm.title}" updated.`);
    } else {
      const newTask: Task = {
        id: Date.now(),
        title: taskForm.title,
        description: taskForm.description,
        employee_id: Number(taskForm.employee_id),
        employee_name: assignedEmp?.name || 'Unassigned',
        department: assignedEmp?.department || 'General',
        priority: taskForm.priority,
        status: 'Pending',
        due_date: taskForm.due_date,
        created_at: new Date().toISOString().split('T')[0]
      };
      setTasks(prev => [newTask, ...prev]);
      addToast('success', `Task assigned to ${assignedEmp?.name || 'employee'}.`);

      // Trigger notification for the assigned employee!
      const targetUser = INITIAL_USERS.find(u => u.employee_id === Number(taskForm.employee_id));
      if (targetUser) {
        const notif: AppNotification = {
          id: Date.now() + 1,
          user_id: targetUser.id,
          title: `New Task Assigned: ${taskForm.title}`,
          message: `You were assigned a new task with ${taskForm.priority} priority. Due: ${taskForm.due_date}`,
          type: 'TASK_ASSIGNED',
          is_read: false,
          task_id: newTask.id,
          task_title: newTask.title,
          created_at: 'Just now'
        };
        setNotifications(prev => [notif, ...prev]);
      }
    }

    setShowTaskModal(false);
    setEditingTask(null);
  };

  // Delete task (Admin Only)
  const handleDeleteTask = (taskId: number) => {
    if (!isAdmin) {
      addToast('error', 'Only administrators can delete tasks.');
      return;
    }
    const t = tasks.find(item => item.id === taskId);
    setTasks(prev => prev.filter(item => item.id !== taskId));
    addToast('success', `Task "${t?.title || taskId}" removed.`);
  };

  // Employee save handler (Admin Only)
  const handleSaveEmp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('error', 'Only administrators can manage employee records.');
      return;
    }
    if (!empForm.name.trim() || !empForm.email.trim()) {
      addToast('warning', 'Employee name and email are required.');
      return;
    }

    if (editingEmp) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmp.id ? {
        ...emp,
        name: empForm.name,
        email: empForm.email,
        department: empForm.department,
        role: empForm.role
      } : emp));
      addToast('success', `Employee "${empForm.name}" updated.`);
    } else {
      const newEmp: Employee = {
        id: Date.now(),
        name: empForm.name,
        email: empForm.email,
        department: empForm.department,
        role: empForm.role,
        tasks_count: 0
      };
      setEmployees(prev => [...prev, newEmp]);
      addToast('success', `Employee "${empForm.name}" added to directory.`);
    }
    setShowEmpModal(false);
    setEditingEmp(null);
  };

  // Delete employee (Admin Only)
  const handleDeleteEmp = (empId: number) => {
    if (!isAdmin) {
      addToast('error', 'Only administrators can delete employees.');
      return;
    }
    const emp = employees.find(e => e.id === empId);
    setEmployees(prev => prev.filter(e => e.id !== empId));
    // Unassign tasks
    setTasks(prev => prev.map(t => t.id === empId ? { ...t, employee_id: 0, employee_name: 'Unassigned' } : t));
    addToast('success', `Employee "${emp?.name}" removed.`);
  };

  // Notification actions
  const markAsRead = (notifId: number) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => n.user_id === currentUser.id ? { ...n, is_read: true } : n));
    addToast('info', 'All notifications marked as read.');
  };

  // Filtered notifications for current user
  const userNotifications = notifications.filter(n => n.user_id === currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* Role Switching & Quick Persona Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">RBAC Session Simulator</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                Live Assessment Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch roles in 1-click to test route access, task assignment visibility, and permission boundaries.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => switchUser(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentUser.id === 1
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin (Full Access)</span>
          </button>

          <button
            type="button"
            onClick={() => switchUser(2)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentUser.id === 2
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Alice (Employee)</span>
          </button>

          <button
            type="button"
            onClick={() => switchUser(3)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentUser.id === 3
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Bob (Employee)</span>
          </button>

          <button
            id="simulator-logout-btn"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/30 transition-all border border-rose-500/20"
            title="Log out and return to Login Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/30">
              EP
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 leading-tight block">TaskPortal</span>
              <span className="text-[10px] text-slate-400 font-medium">Angular + Flask Stack</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'tasks'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks
            </button>

            {/* Employees tab - ONLY visible to Admin */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setCurrentTab('employees')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'employees'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Employees
              </button>
            ) : (
              <span
                className="px-2 py-1 text-[10px] text-slate-400 font-medium cursor-not-allowed opacity-50 flex items-center gap-1"
                title="Restricted to Administrator role"
              >
                <span>🔒</span> Employees
              </span>
            )}
          </nav>
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Notification Center</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {unreadCount} unread
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {userNotifications.length > 0 ? (
                    userNotifications.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          markAsRead(item.id);
                          setCurrentTab('tasks');
                          setIsNotifOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !item.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              item.type === 'TASK_ASSIGNED'
                                ? 'bg-blue-100 text-blue-700'
                                : item.type === 'DUE_SOON'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {item.type === 'TASK_ASSIGNED' && '📋'}
                            {item.type === 'DUE_SOON' && '⏰'}
                            {item.type === 'STATUS_UPDATED' && '🔄'}
                            {item.type === 'SYSTEM' && '💬'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                            {!item.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{item.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{item.created_at}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No notifications found for this account.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Profile Pill & Logout Action */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {currentUser.username}
              </span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                  isAdmin
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {isAdmin ? 'Administrator' : 'Employee'}
              </span>
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </div>

            {/* Logout Button */}
            <button
              id="header-logout-btn"
              type="button"
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Sign out of TaskPortal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>

        </div>

      </header>

      {/* View 1: DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {isAdmin ? 'Organizational Dashboard' : `Welcome Back, ${currentUser.username}!`}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isAdmin
                  ? 'Real-time overview of workforce allocation, task statuses, and completion velocity.'
                  : 'Here is your personalized agenda. Focus on upcoming deadlines and active deliverables.'}
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskForm({
                      title: '',
                      description: '',
                      employee_id: employees[0]?.id || 1,
                      priority: 'Medium',
                      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                      status: 'Pending'
                    });
                    setShowTaskModal(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            )}
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAdmin ? 'Total Tasks' : 'My Assigned Tasks'}
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {isAdmin ? tasks.length : tasks.filter(t => t.employee_id === currentUser.employee_id).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Across all categories</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-amber-900 mt-2">
                {isAdmin
                  ? tasks.filter(t => t.status === 'Pending').length
                  : tasks.filter(t => t.employee_id === currentUser.employee_id && t.status === 'Pending').length}
              </p>
              <p className="text-[11px] text-amber-600/80 mt-1">Awaiting execution</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              </div>
              <p className="text-3xl font-extrabold text-blue-900 mt-2">
                {isAdmin
                  ? tasks.filter(t => t.status === 'In Progress').length
                  : tasks.filter(t => t.employee_id === currentUser.employee_id && t.status === 'In Progress').length}
              </p>
              <p className="text-[11px] text-blue-600/80 mt-1">Active execution</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 mt-2">
                {isAdmin
                  ? tasks.filter(t => t.status === 'Completed').length
                  : tasks.filter(t => t.employee_id === currentUser.employee_id && t.status === 'Completed').length}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-1">Delivered deliverables</p>
            </div>

          </div>

          {/* Two-Column Grid: Active Work & Priorities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Recent Tasks */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isAdmin ? 'Recent Tasks' : 'My Upcoming Deadlines'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAdmin ? 'Latest organizational workload' : 'Quickly toggle your deliverables status below'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('tasks')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{task.title}</span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            task.priority === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {isDueSoon(task.due_date) && task.status !== 'Completed' && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                            ⏰ Due Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {isAdmin && (
                          <span>Assigned to: <strong>{task.employee_name}</strong> • </span>
                        )}
                        <span>Due: <strong>{task.due_date}</strong></span>
                      </p>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Breakdown & Notifications preview */}
            <div className="space-y-6">
              
              {/* Priority Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-base text-slate-900">Priority Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-700">High Priority</span>
                      <span className="text-slate-900">
                        {visibleTasks.filter(t => t.priority === 'High').length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(visibleTasks.filter(t => t.priority === 'High').length / (visibleTasks.length || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-700">Medium Priority</span>
                      <span className="text-slate-900">
                        {visibleTasks.filter(t => t.priority === 'Medium').length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(visibleTasks.filter(t => t.priority === 'Medium').length / (visibleTasks.length || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-blue-700">Low Priority</span>
                      <span className="text-slate-900">
                        {visibleTasks.filter(t => t.priority === 'Low').length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(visibleTasks.filter(t => t.priority === 'Low').length / (visibleTasks.length || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Overview (Admin Only) */}
              {isAdmin && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                  <h3 className="font-bold text-base text-slate-900">Department Workforce</h3>
                  <div className="divide-y divide-slate-100 text-xs">
                    {['Engineering', 'Design', 'Marketing', 'Operations'].map(dept => {
                      const count = employees.filter(e => e.department === dept).length;
                      return (
                        <div key={dept} className="py-2 flex items-center justify-between">
                          <span className="font-medium text-slate-700">{dept}</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                            {count} members
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* View 2: TASKS TAB */}
      {currentTab === 'tasks' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Task Directory</h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isAdmin ? 'All Organizational Tasks' : 'My Assigned Deliverables'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isAdmin
                  ? 'Assign, modify, prioritize, and delete tasks across all employees.'
                  : 'View your assigned work items and update status progress as tasks evolve.'}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskForm({
                    title: '',
                    description: '',
                    employee_id: employees[0]?.id || 1,
                    priority: 'Medium',
                    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    status: 'Pending'
                  });
                  setShowTaskModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setTaskSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Task Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleTasks.map(task => (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDueSoon(task.due_date) && task.status !== 'Completed'
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 text-sm leading-snug">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {task.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {task.employee_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{task.employee_name}</p>
                            <p className="text-[10px] text-slate-400">{task.department}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                            task.priority === 'High'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : task.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{task.due_date}</span>
                          {isDueSoon(task.due_date) && task.status !== 'Completed' && (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                              <span>⏰</span> Due Soon!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors ${
                            task.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : task.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setTaskForm({
                                title: task.title,
                                description: task.description,
                                employee_id: task.employee_id,
                                priority: task.priority,
                                due_date: task.due_date,
                                status: task.status
                              });
                              setShowTaskModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {visibleTasks.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400 text-xs">
                        No tasks match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* View 3: EMPLOYEES TAB (Admin Only) */}
      {currentTab === 'employees' && (
        <div className="space-y-6 animate-fade-in">
          
          {isAdmin ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Admin Access
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage team members, department alignments, and assigned task workloads.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingEmp(null);
                    setEmpForm({
                      name: '',
                      email: '',
                      department: 'Engineering',
                      role: 'Software Engineer'
                    });
                    setShowEmpModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>

              {/* Employee Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Title / Role</th>
                        <th className="py-3 px-4 text-center">Active Tasks</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map(emp => {
                        const activeTaskCount = tasks.filter(t => t.employee_id === emp.id).length;
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 text-sm">{emp.name}</div>
                              <div className="text-xs text-slate-400">{emp.email}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                {emp.department}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {emp.role}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                                  activeTaskCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {activeTaskCount}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEmp(emp);
                                  setEmpForm({
                                    name: emp.name,
                                    email: emp.email,
                                    department: emp.department,
                                    role: emp.role
                                  });
                                  setShowEmpModal(true);
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                title="Edit Employee"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteEmp(emp.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                                title="Delete Employee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="font-bold text-base text-rose-900">Access Restricted (403 Forbidden)</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Regular employees do not have authorization to view or manipulate the organizational employee directory. This route is guarded by both Flask <code>@admin_required</code> and Angular <code>roleGuard</code>.
              </p>
              <button
                type="button"
                onClick={() => switchUser(1)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Switch to Administrator to view
              </button>
            </div>
          )}

        </div>
      )}

      {/* Task Modal (Create / Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? 'Edit Task' : 'Create & Assign New Task'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement Unit Tests"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Details and deliverables..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={taskForm.employee_id}
                    onChange={(e) => setTaskForm({ ...taskForm, employee_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {editingTask ? 'Update Task' : 'Create & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal (Create / Edit) */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmp ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEmpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="e.g. Jordan Lee"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  placeholder="e.g. jordan@taskportal.io"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Role</label>
                  <input
                    type="text"
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-400 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-400 text-amber-900'
                : 'bg-blue-50 border-blue-400 text-blue-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-sm font-bold mt-0.5">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <div>
                {toast.title && <p className="font-bold text-xs">{toast.title}</p>}
                <p className="text-xs font-medium leading-snug">{toast.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
