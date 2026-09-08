# Employee Task Management Portal (Production MVP)

An enterprise-grade, full-stack Task Management Portal built for modern team workflows, featuring strict **Role-Based Access Control (RBAC)**, an integrated **Notification System**, responsive dashboard views, and a modular architecture designed for high maintainability and clarity.

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |         Client Browser                |
                                  |  Angular 17+ (TypeScript, Tailwind)   |
                                  +-------------------+-------------------+
                                                      |
                                           JWT Bearer Token / HTTPS
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |           Flask REST API              |
                                  |    (Python 3.11+, Blueprints, JWT)    |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
        +-----------------------+         +-----------------------+         +-----------------------+
        |  Auth & RBAC Service  |         |  Notification Engine  |         |   Task & Employee     |
        |  (Token, Roles, Dec.) |         | (Triggers, Due Alerts)|         |      Services         |
        +-----------+-----------+         +-----------+-----------+         +-----------+-----------+
                    |                                 |                                 |
                    +---------------------------------+---------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       SQLAlchemy ORM Layer            |
                                  |     (MySQL / PostgreSQL / SQLite)     |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |           Relational Database         |
                                  |  users, employees, tasks, notifs      |
                                  +---------------------------------------+
```

### Key Architectural Layers
1. **Frontend (Angular 17+)**:
   - **Modern Standalone Architecture**: No legacy NgModules. Components, directives, and pipes are standalone.
   - **Reactive Forms**: Strict schema validation with live error messaging.
   - **Angular Signals & Observables**: State synchronization for current user, unread notification counter, and real-time toast alerts.
   - **Functional Guards & Interceptors**:
     - `jwt.interceptor.ts`: Attaches `Authorization: Bearer <token>` to all API requests; handles 401 token expiry redirection.
     - `auth.guard.ts`: Enforces authentication on protected routes.
     - `role.guard.ts`: Restricts administrative routes (`/employees`, creation modals) exclusively to users with the `admin` role.
2. **Backend (Python / Flask)**:
   - **Application Factory Pattern**: Clean instantiation via `create_app(config_name)` supporting development, production, and testing contexts.
   - **Modular Blueprints**: Separated domains (`auth_bp`, `employees_bp`, `tasks_bp`, `notifications_bp`, `dashboard_bp`).
   - **Role Decorators**: `@token_required` and `@admin_required` composable decorators ensuring security at the API gateway layer.
   - **Automated Testing**: 15 test cases written in `pytest` verifying auth, CRUD operations, RBAC isolation, and notification generation.

---

## 2. User Roles and Permissions (RBAC)

The system implements two distinct user roles:

| Capability | Administrator (`admin`) | Regular Employee (`user`) |
| :--- | :---: | :---: |
| **Authentication & Profile** | Log in, view profile & role badge | Log in, view profile & role badge |
| **Dashboard Metrics** | Company-wide KPIs, department distributions | Personal agenda, my tasks, upcoming deadlines |
| **Employee Directory** | Full CRUD (Add, Edit, Delete, Search) | **Restricted (403 Forbidden)** |
| **Create Tasks** | Assign tasks to any employee | **Restricted (403 Forbidden)** |
| **Edit / Delete Tasks** | Modify task details, delete tasks | **Restricted (403 Forbidden)** |
| **View Tasks** | View all organizational tasks & filter | View **only tasks assigned to them** |
| **Update Task Status** | Update status of any task | Update status of **their own assigned tasks only** |
| **Notification Center** | System & organizational notifications | Personalized task assignments, updates & due alerts |

---

## 3. Notification System

The notification system alerts users to important events in real time:

1. **Trigger 1: Task Assignment (`TASK_ASSIGNED`)**
   - Automatically dispatched to an employee when an administrator creates and assigns a task to them.
2. **Trigger 2: Task Status Update (`STATUS_UPDATED`)**
   - Dispatched when a task's status changes (`Pending` -> `In Progress` -> `Completed`).
3. **Trigger 3: Due Soon Warning (`DUE_SOON`)**
   - Dynamically generated when a task is due within 24 hours (or overdue) and has not yet been completed.
4. **Display Channels**:
   - **In-App Toast Alerts**: Non-intrusive floating banners that appear immediately when an action or notification arrives.
   - **Notification Center Flyout**: Accessible via the top-navbar bell icon, featuring an unread count badge, colored event tags, and a "Mark all as read" button.

---

## 4. Database Schema & ER Diagram

```
+-----------------------------------------------------------------------------------+
|                                      users                                        |
+-------------------+-------------------+-------------------------------------------+
| id                | INT (PK)          | Unique user account ID                    |
| username          | VARCHAR(80)       | Unique username (e.g. 'admin', 'alice')   |
| email             | VARCHAR(120)      | Unique user email                         |
| password_hash     | VARCHAR(255)      | Werkzeug SHA-256 hashed password          |
| role              | VARCHAR(20)       | 'admin' or 'user' (defaults to 'user')    |
| employee_id       | INT (FK, Nullable)| Foreign key -> employees(id)              |
| created_at        | DATETIME          | Account registration timestamp            |
+-------------------+-------------------+-------------------------------------------+
         |                                           |
         | 1:N                                       | N:1 (Optional link)
         v                                           v
+-----------------------+                  +-----------------------+
|     notifications     |                  |       employees       |
+-----------------------+                  +-----------------------+
| id          | INT(PK) |                  | id          | INT(PK) |
| user_id     | INT(FK) |                  | name        | VARCHAR |
| title       | VARCHAR |                  | email       | VARCHAR |
| message     | TEXT    |                  | department  | VARCHAR |
| type        | VARCHAR |                  | role        | VARCHAR |
| is_read     | BOOLEAN |                  | created_at  | DATETIME|
| task_id     | INT(FK) |                  +-----------+-----------+
| created_at  | DATETIME|                              |
+-----------------------+                              | 1:N
                                                       v
                                           +-----------------------+
                                           |         tasks         |
                                           +-----------------------+
                                           | id          | INT(PK) |
                                           | title       | VARCHAR |
                                           | description | TEXT    |
                                           | employee_id | INT(FK) |
                                           | priority    | VARCHAR |
                                           | status      | VARCHAR |
                                           | due_date    | DATE    |
                                           | created_at  | DATETIME|
                                           | updated_at  | DATETIME|
                                           +-----------------------+
```

---

## 5. REST API Documentation

Base URL: `/api`

### Authentication (`/api/auth`)
- `POST /api/auth/login`
  - Body: `{"username": "admin", "password": "Admin@123"}`
  - Response: `{"success": true, "data": {"token": "jwt...", "user": {"id": 1, "username": "admin", "role": "admin"}}}`

### Employees (`/api/employees`)
- `GET /api/employees?search=alice` — Retrieve employees (filtered by keyword).
- `POST /api/employees` — **[Admin Only]** Create new employee record.
- `GET /api/employees/<id>` — Retrieve single employee details and task history.
- `PUT /api/employees/<id>` — **[Admin Only]** Update employee record.
- `DELETE /api/employees/<id>` — **[Admin Only]** Delete employee record.

### Tasks (`/api/tasks`)
- `GET /api/tasks?status=Pending&priority=High` — List tasks.
  - *Admins receive all matching tasks; regular employees receive only tasks assigned to them.*
- `POST /api/tasks` — **[Admin Only]** Create and assign task. Automatically generates `TASK_ASSIGNED` notification.
- `GET /api/tasks/<id>` — Get task details. Restricted to admin or assigned employee.
- `PUT /api/tasks/<id>` — **[Admin Only]** Update task title, description, assignee, priority, due date.
- `PATCH /api/tasks/<id>/status` — **[Admin or Assigned Employee]** Update task status (`Pending`, `In Progress`, `Completed`). Automatically generates `STATUS_UPDATED` notification.
- `DELETE /api/tasks/<id>` — **[Admin Only]** Delete task.

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch notifications and unread count for current user (auto-checks for due-soon alerts).
- `PATCH /api/notifications/<id>/read` — Mark single notification as read.
- `POST /api/notifications/mark-all-read` — Mark all notifications as read.
- `DELETE /api/notifications/<id>` — Dismiss / delete notification.

### Dashboard (`/api/dashboard/stats`)
- `GET /api/dashboard/stats` — Return tailored summary metrics based on the caller's role (`admin` vs `user`).

---

## 6. Setup and Run Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MySQL or PostgreSQL server, or default SQLite

### Backend Setup
```bash
cd employee-task-portal/backend

# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables (optional, defaults to SQLite)
cp .env.example .env

# 4. Seed database with default admin and employee accounts
python app/seed.py

# 5. Run backend server (binds to http://127.0.0.1:5000)
python run.py
```

### Frontend Setup
```bash
cd employee-task-portal/frontend

# 1. Install dependencies
npm install

# 2. Launch development server
npm start
# Navigate to http://localhost:4200
```

### Running Test Suite
```bash
cd employee-task-portal/backend
PYTHONPATH=. pytest tests -v
```
All 15 tests will execute and pass, verifying security constraints and notification triggers.

---

## 7. Default Credentials for Technical Assessment

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Full access: CRUD employees, create/reassign tasks, organization-wide dashboard |
| **Employee (User)** | `alice` | `Alice@123` | Role-restricted: View personal agenda, update status, receive notifications |
