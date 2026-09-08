import { Employee, Task, User, AppNotification } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@taskportal.io',
    role: 'admin',
    employee_id: null,
    salt: 'salt_admin_89f',
    password_hash: 'fb8391295d0e49835b96a3490449ef922b7f2bff3c99428da2e8480ce870d656'
  },
  {
    id: 2,
    username: 'alice',
    email: 'alice.smith@taskportal.io',
    role: 'user',
    employee_id: 1,
    salt: 'salt_alice_23c',
    password_hash: 'c41d831f11e484316cb573e7e78435f49b4f40154e717630aa2945ac4b139d0a'
  },
  {
    id: 3,
    username: 'bob',
    email: 'bob.jones@taskportal.io',
    role: 'user',
    employee_id: 2,
    salt: 'salt_bob_41e',
    password_hash: '2c208ab41986772c3c9adda57bde0cc7d85dd423c57ed218224c2e66ac35af5a'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice.smith@taskportal.io',
    department: 'Engineering',
    role: 'Senior Frontend Engineer',
    tasks_count: 3
  },
  {
    id: 2,
    name: 'Bob Jones',
    email: 'bob.jones@taskportal.io',
    department: 'Design',
    role: 'Staff Product Designer',
    tasks_count: 2
  },
  {
    id: 3,
    name: 'Charlie Davis',
    email: 'charlie.davis@taskportal.io',
    department: 'Engineering',
    role: 'Backend Architect',
    tasks_count: 2
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana.prince@taskportal.io',
    department: 'Marketing',
    role: 'Growth Lead',
    tasks_count: 1
  },
  {
    id: 5,
    name: 'Evan Wright',
    email: 'evan.wright@taskportal.io',
    department: 'Operations',
    role: 'DevOps Lead',
    tasks_count: 2
  }
];

// Calculate dynamic due dates relative to today
const today = new Date();
const formatDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Implement Angular RBAC Route Guards',
    description: 'Enforce role-based access to the employee directory and creation modals using functional CanActivateFn guards.',
    employee_id: 1,
    employee_name: 'Alice Smith',
    department: 'Engineering',
    priority: 'High',
    status: 'In Progress',
    due_date: formatDate(0), // Due today -> triggers Due Soon!
    created_at: formatDate(-2)
  },
  {
    id: 2,
    title: 'Audit JWT Expiry & Refresh Token Flow',
    description: 'Ensure expired tokens return 401 and trigger proper redirect to login screen without infinite reload loops.',
    employee_id: 1,
    employee_name: 'Alice Smith',
    department: 'Engineering',
    priority: 'High',
    status: 'Pending',
    due_date: formatDate(1), // Due tomorrow -> triggers Due Soon!
    created_at: formatDate(-1)
  },
  {
    id: 3,
    title: 'Design Notification Bell Flyout Component',
    description: 'Create high-contrast notification item cards with category pills, unread dot indicators, and relative timestamps.',
    employee_id: 2,
    employee_name: 'Bob Jones',
    department: 'Design',
    priority: 'Medium',
    status: 'Completed',
    due_date: formatDate(3),
    created_at: formatDate(-4)
  },
  {
    id: 4,
    title: 'Build Flask Notification Service & Blueprint',
    description: 'Provide endpoints for fetching notifications, marking them read, and triggering alerts on task assignments.',
    employee_id: 3,
    employee_name: 'Charlie Davis',
    department: 'Engineering',
    priority: 'High',
    status: 'Completed',
    due_date: formatDate(2),
    created_at: formatDate(-3)
  },
  {
    id: 5,
    title: 'Automated 24h Due Soon Notification Sweeper',
    description: 'Verify dynamic notification generation when tasks reach within 24 hours of their deadline.',
    employee_id: 1,
    employee_name: 'Alice Smith',
    department: 'Engineering',
    priority: 'Medium',
    status: 'In Progress',
    due_date: formatDate(1),
    created_at: formatDate(-1)
  },
  {
    id: 6,
    title: 'Setup Production CI/CD & Pytest Runner',
    description: 'Configure automated pipeline running pytest with SQLite in-memory fixtures and coverage reporting.',
    employee_id: 5,
    employee_name: 'Evan Wright',
    department: 'Operations',
    priority: 'Low',
    status: 'Pending',
    due_date: formatDate(5),
    created_at: formatDate(-2)
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    user_id: 2, // Alice
    title: 'Task Assigned: Implement Angular RBAC',
    message: 'Administrator assigned you to task "Implement Angular RBAC Route Guards" with High priority.',
    type: 'TASK_ASSIGNED',
    is_read: false,
    task_id: 1,
    task_title: 'Implement Angular RBAC Route Guards',
    created_at: '10 minutes ago'
  },
  {
    id: 2,
    user_id: 2, // Alice
    title: 'Due Soon: Implement Angular RBAC Route Guards',
    message: 'This task is due today! Please verify completion status or update progress notes.',
    type: 'DUE_SOON',
    is_read: false,
    task_id: 1,
    task_title: 'Implement Angular RBAC Route Guards',
    created_at: '25 minutes ago'
  },
  {
    id: 3,
    user_id: 2, // Alice
    title: 'Status Updated: Audit JWT Expiry',
    message: 'Task status was updated to In Progress by team lead.',
    type: 'STATUS_UPDATED',
    is_read: true,
    task_id: 2,
    task_title: 'Audit JWT Expiry & Refresh Token Flow',
    created_at: '2 hours ago'
  },
  {
    id: 4,
    user_id: 1, // Admin
    title: 'Task Completed by Bob Jones',
    message: 'Bob Jones marked "Design Notification Bell Flyout Component" as Completed.',
    type: 'STATUS_UPDATED',
    is_read: false,
    task_id: 3,
    task_title: 'Design Notification Bell Flyout Component',
    created_at: '1 hour ago'
  }
];
