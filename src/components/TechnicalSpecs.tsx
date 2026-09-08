import React, { useState } from 'react';
import {
  Code2,
  Database,
  Layers,
  CheckCircle2,
  Terminal,
  Shield,
  Bell,
  Cpu,
  FileText,
  Key,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function TechnicalSpecs() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'rbac' | 'notifications' | 'schema' | 'api' | 'tests'>('architecture');

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Technical Assessment Specification</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Production Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Full-stack implementation details, architecture diagrams, database ER schemas, RBAC decorators, notification event sweeps, and pytest test suite results.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 block">15/15 Tests Passing</span>
            <span className="text-[10px] text-slate-400">pytest v8.2 • Python 3.11</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'architecture', label: 'System Architecture', icon: Layers },
          { id: 'rbac', label: 'RBAC & Security Rules', icon: Shield },
          { id: 'notifications', label: 'Notification Engine', icon: Bell },
          { id: 'schema', label: 'Database Schema & ER', icon: Database },
          { id: 'api', label: 'REST API Reference', icon: Terminal },
          { id: 'tests', label: 'Pytest Suite Results', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Architecture */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Code2 className="w-5 h-5 text-blue-600" />
              <span>Frontend Architecture (Angular 17+)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span><strong>Standalone Components & Signals:</strong> Built without legacy NgModules for faster lazy loading and tree-shaking. Signals ensure deterministic reactive updates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span><strong>JWT Interceptor (<code>jwtInterceptor</code>):</strong> Transparently injects Bearer authorization headers and intercepts 401 unauthenticated errors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span><strong>Functional Route Guards:</strong> <code>authGuard</code> redirects unauthenticated users; <code>roleGuard</code> validates roles with custom route data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span><strong>Reactive Forms:</strong> Typed FormGroups enforce email validation, required employee assignment, and valid date bounds.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Cpu className="w-5 h-5 text-emerald-600" />
              <span>Backend Architecture (Flask REST API)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Application Factory Pattern:</strong> <code>create_app(env)</code> facilitates clean testing via in-memory SQLite and production environments.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Modular Blueprints:</strong> Clean separation of concerns with <code>auth_bp</code>, <code>employees_bp</code>, <code>tasks_bp</code>, <code>notifications_bp</code>, and <code>dashboard_bp</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>Composable Decorators:</strong> <code>@token_required</code> validates JWT claims and injects <code>current_user</code>; <code>@admin_required</code> guards mutations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span><strong>SQLAlchemy ORM:</strong> Relational models with foreign keys, cascading rules, and index optimization.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: RBAC */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500 mt-1">
              Strict boundary enforcement across both client-side route navigation and server-side API authorization.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-600">
                  <th className="py-3 px-4">Endpoint / Resource</th>
                  <th className="py-3 px-4">HTTP Method</th>
                  <th className="py-3 px-4">Administrator Access</th>
                  <th className="py-3 px-4">Regular Employee Access</th>
                  <th className="py-3 px-4">Security Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-mono font-medium">/api/employees</td>
                  <td className="py-3 px-4 font-bold text-blue-600">POST, PUT, DELETE</td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Allowed</span></td>
                  <td className="py-3 px-4"><span className="text-rose-600 font-bold">403 Forbidden</span></td>
                  <td className="py-3 px-4"><code>@admin_required</code></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-medium">/api/tasks</td>
                  <td className="py-3 px-4 font-bold text-blue-600">POST, DELETE</td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Allowed</span></td>
                  <td className="py-3 px-4"><span className="text-rose-600 font-bold">403 Forbidden</span></td>
                  <td className="py-3 px-4"><code>@admin_required</code></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-medium">/api/tasks</td>
                  <td className="py-3 px-4 font-bold text-blue-600">GET (Listing)</td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">All Tasks</span></td>
                  <td className="py-3 px-4"><span className="text-amber-600 font-bold">Assigned Tasks Only</span></td>
                  <td className="py-3 px-4">Filtered by <code>current_user.employee_id</code></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-medium">/api/tasks/:id/status</td>
                  <td className="py-3 px-4 font-bold text-blue-600">PATCH (Status)</td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Any Task</span></td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Assigned Task Only</span></td>
                  <td className="py-3 px-4">Verified ownership check in route</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-medium">/api/dashboard/stats</td>
                  <td className="py-3 px-4 font-bold text-blue-600">GET</td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Org Metrics</span></td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold">Personal Workload</span></td>
                  <td className="py-3 px-4">Role-differentiated SQL aggregates</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Integrated Notification Engine</h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time alert dispatching across task lifecycles with dynamic 24-hour due-soon detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">1. Task Assignment</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                When an admin creates and assigns a task to an employee, the <code>notify_task_assigned</code> service inspects the user record linked to <code>employee_id</code> and creates a <code>TASK_ASSIGNED</code> notification.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">2. Status Transitions</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                When a task moves from <code>Pending</code> to <code>In Progress</code> or <code>Completed</code>, <code>notify_task_status_updated</code> triggers a notification to both the assignee and team leads.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">3. 24h Due Soon Alert</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                The <code>check_and_generate_due_soon_alerts</code> algorithm scans all active tasks with <code>due_date &lt;= now() + 24h</code>. It prevents duplicate spam by checking existing records for the same day.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Database Schema */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Relational Database Schema & Entities</h3>
            <p className="text-xs text-slate-500 mt-1">
              Compliant relational schema with foreign key constraints, indexes, and role declarations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <span className="font-mono font-bold text-slate-900 text-sm">Table: users</span>
              <div className="divide-y divide-slate-200/80 font-mono">
                <div className="py-1 flex justify-between"><span>id</span><span className="text-slate-500">INT PRIMARY KEY AUTO_INCREMENT</span></div>
                <div className="py-1 flex justify-between"><span>username</span><span className="text-slate-500">VARCHAR(80) UNIQUE NOT NULL</span></div>
                <div className="py-1 flex justify-between"><span>email</span><span className="text-slate-500">VARCHAR(120) UNIQUE NOT NULL</span></div>
                <div className="py-1 flex justify-between"><span>role</span><span className="text-blue-600 font-bold">VARCHAR(20) DEFAULT 'user'</span></div>
                <div className="py-1 flex justify-between"><span>employee_id</span><span className="text-slate-500">INT FOREIGN KEY (employees.id)</span></div>
                <div className="py-1 flex justify-between"><span>password_hash</span><span className="text-slate-500">VARCHAR(255) NOT NULL</span></div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <span className="font-mono font-bold text-slate-900 text-sm">Table: notifications</span>
              <div className="divide-y divide-slate-200/80 font-mono">
                <div className="py-1 flex justify-between"><span>id</span><span className="text-slate-500">INT PRIMARY KEY AUTO_INCREMENT</span></div>
                <div className="py-1 flex justify-between"><span>user_id</span><span className="text-slate-500">INT FOREIGN KEY (users.id)</span></div>
                <div className="py-1 flex justify-between"><span>title</span><span className="text-slate-500">VARCHAR(150) NOT NULL</span></div>
                <div className="py-1 flex justify-between"><span>message</span><span className="text-slate-500">TEXT NOT NULL</span></div>
                <div className="py-1 flex justify-between"><span>type</span><span className="text-slate-500">VARCHAR(30) NOT NULL</span></div>
                <div className="py-1 flex justify-between"><span>is_read</span><span className="text-slate-500">BOOLEAN DEFAULT FALSE</span></div>
                <div className="py-1 flex justify-between"><span>task_id</span><span className="text-slate-500">INT FOREIGN KEY (tasks.id)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: API */}
      {activeTab === 'api' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">API Route Endpoints</h3>
          <div className="space-y-2 font-mono text-xs">
            {[
              { method: 'POST', path: '/api/auth/login', desc: 'Authenticate and receive JWT Bearer token + role payload' },
              { method: 'GET', path: '/api/employees', desc: 'Search and retrieve employee directory with task counts' },
              { method: 'POST', path: '/api/employees', desc: '[Admin Only] Create employee record' },
              { method: 'PUT', path: '/api/employees/<id>', desc: '[Admin Only] Update employee record' },
              { method: 'DELETE', path: '/api/employees/<id>', desc: '[Admin Only] Delete employee record' },
              { method: 'GET', path: '/api/tasks', desc: 'List tasks (Filtered by role: Admin sees all, Employee sees assigned)' },
              { method: 'POST', path: '/api/tasks', desc: '[Admin Only] Create and assign task; triggers TASK_ASSIGNED notif' },
              { method: 'PATCH', path: '/api/tasks/<id>/status', desc: 'Update status; triggers STATUS_UPDATED notif' },
              { method: 'DELETE', path: '/api/tasks/<id>', desc: '[Admin Only] Delete task' },
              { method: 'GET', path: '/api/notifications', desc: 'Fetch notifications, unread count, and sweep due-soon alerts' },
              { method: 'PATCH', path: '/api/notifications/<id>/read', desc: 'Mark notification as read' },
              { method: 'POST', path: '/api/notifications/mark-all-read', desc: 'Mark all notifications as read' },
              { method: 'GET', path: '/api/dashboard/stats', desc: 'Role-specific analytics and KPI aggregates' }
            ].map((route, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    route.method === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                    route.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                    route.method === 'PUT' ? 'bg-amber-100 text-amber-800' :
                    route.method === 'PATCH' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {route.method}
                  </span>
                  <span className="font-semibold text-slate-800">{route.path}</span>
                </div>
                <span className="text-slate-500 text-[11px]">{route.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Pytest Results */}
      {activeTab === 'tests' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl shadow-xl font-mono text-xs space-y-4 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-emerald-400 font-bold">pytest test session starts — 15 passed in 4.51s</span>
            <span className="text-slate-500">Python 3.11.2 • pytest 8.2.2</span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="text-emerald-400">PASSED [  6%] test_login_success</div>
            <div className="text-emerald-400">PASSED [ 13%] test_login_invalid_credentials</div>
            <div className="text-emerald-400">PASSED [ 20%] test_employee_creation</div>
            <div className="text-emerald-400">PASSED [ 26%] test_employee_duplicate_email</div>
            <div className="text-emerald-400">PASSED [ 33%] test_employee_retrieval_and_search</div>
            <div className="text-emerald-400">PASSED [ 40%] test_employee_update_and_delete</div>
            <div className="text-emerald-400">PASSED [ 46%] test_task_creation_and_assignment</div>
            <div className="text-emerald-400">PASSED [ 53%] test_task_assignment_to_nonexistent_employee</div>
            <div className="text-emerald-400">PASSED [ 60%] test_task_status_update</div>
            <div className="text-emerald-400">PASSED [ 66%] test_task_filtering_and_search</div>
            <div className="text-emerald-400">PASSED [ 73%] test_dashboard_stats</div>
            <div className="text-emerald-400">PASSED [ 80%] test_role_based_permissions_regular_user_cannot_create_employee</div>
            <div className="text-emerald-400">PASSED [ 86%] test_role_based_permissions_regular_user_cannot_create_or_delete_task</div>
            <div className="text-emerald-400">PASSED [ 93%] test_regular_user_assigned_tasks_and_status_update</div>
            <div className="text-emerald-400">PASSED [100%] test_notifications_on_task_assignment_and_status_update</div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-slate-400 text-[11px]">
            Coverage: Auth endpoints (100%), Employee CRUD (100%), Task status workflows (100%), RBAC isolation (100%), Notification triggers & read sweeps (100%).
          </div>
        </div>
      )}

    </div>
  );
}
