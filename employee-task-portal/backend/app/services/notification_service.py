from datetime import datetime, date, timedelta
from app.extensions import db
from app.models.notification import Notification
from app.models.user import User
from app.models.employee import Employee
from app.models.task import Task

def create_notification(user_id: int, title: str, message: str, notif_type: str = 'SYSTEM', task_id: int = None) -> Notification:
    """Create and persist a notification for a user."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        task_id=task_id,
        is_read=False
    )
    db.session.add(notif)
    db.session.commit()
    return notif

def find_user_for_employee(employee_id: int) -> User | None:
    """Find the user account linked to an employee by employee_id or matching email."""
    if not employee_id:
        return None
    # Check explicit foreign key link
    user = User.query.filter_by(employee_id=employee_id).first()
    if user:
        return user
    # Fallback to email match
    employee = db.session.get(Employee, employee_id)
    if employee:
        user = User.query.filter_by(email=employee.email).first()
        if user and not user.employee_id:
            user.employee_id = employee.id
            db.session.commit()
        return user
    return None

def notify_task_assigned(task: Task, assigned_employee_id: int = None):
    """Triggered when a task is assigned to an employee."""
    emp_id = assigned_employee_id or task.employee_id
    if not emp_id:
        return

    user = find_user_for_employee(emp_id)
    if not user:
        return

    due_str = str(task.due_date) if task.due_date else 'Not set'
    create_notification(
        user_id=user.id,
        title=f"New Task Assigned: {task.title}",
        message=f"You have been assigned to task '{task.title}' with {task.priority} priority (Due: {due_str}).",
        notif_type='TASK_ASSIGNED',
        task_id=task.id
    )

def notify_task_status_updated(task: Task, old_status: str, new_status: str, updated_by_user: User = None):
    """Triggered when task status changes."""
    if old_status == new_status:
        return

    # Notify assigned user if different from editor
    if task.employee_id:
        assigned_user = find_user_for_employee(task.employee_id)
        if assigned_user:
            create_notification(
                user_id=assigned_user.id,
                title=f"Task Status Changed: {task.title}",
                message=f"Task '{task.title}' status was updated from '{old_status}' to '{new_status}'.",
                notif_type='STATUS_UPDATED',
                task_id=task.id
            )

    # If updated by a regular user, notify admins
    if updated_by_user and updated_by_user.role == 'user':
        admins = User.query.filter_by(role='admin').all()
        for admin in admins:
            create_notification(
                user_id=admin.id,
                title=f"Task Progress: {task.title}",
                message=f"User {updated_by_user.username} changed '{task.title}' to '{new_status}'.",
                notif_type='STATUS_UPDATED',
                task_id=task.id
            )

def check_and_generate_due_soon_alerts():
    """Scan tasks due within 24 hours (or overdue) that are not yet Completed and create alerts."""
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # Find tasks due today or tomorrow that are not completed
    tasks_due = Task.query.filter(
        Task.status.in_(['Pending', 'In Progress']),
        Task.due_date <= tomorrow
    ).all()

    for task in tasks_due:
        if not task.employee_id:
            continue
        user = find_user_for_employee(task.employee_id)
        if not user:
            continue

        # Check if already notified in last 20 hours
        twenty_hours_ago = datetime.utcnow() - timedelta(hours=20)
        existing = Notification.query.filter(
            Notification.user_id == user.id,
            Notification.task_id == task.id,
            Notification.type == 'DUE_SOON',
            Notification.created_at >= twenty_hours_ago
        ).first()

        if not existing:
            create_notification(
                user_id=user.id,
                title=f"Deadline Approaching: {task.title}",
                message=f"Task '{task.title}' is due on {task.due_date} ({task.status}). Please ensure it is completed on time.",
                notif_type='DUE_SOON',
                task_id=task.id
            )
