from datetime import datetime
from flask import Blueprint, request
from sqlalchemy import or_
from app.extensions import db
from app.models.task import Task
from app.models.employee import Employee
from app.utils.response import success_response, error_response
from app.utils.validators import validate_task_data
from app.utils.auth_decorator import token_required, admin_required
from app.services.notification_service import notify_task_assigned, notify_task_status_updated

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

def get_linked_employee_id(current_user):
    """Retrieve employee ID linked to the user account."""
    if current_user.employee_id:
        return current_user.employee_id
    employee = Employee.query.filter_by(email=current_user.email).first()
    if employee:
        current_user.employee_id = employee.id
        db.session.commit()
        return employee.id
    return None

@tasks_bp.route('', methods=['GET'])
@token_required
def get_tasks(current_user):
    """
    List tasks with optional filtering:
    - If user role is 'user', restrict exclusively to their assigned tasks.
    - If user role is 'admin', allow viewing all tasks with filters:
      ?search=, ?status=, ?priority=, ?employee_id=
    """
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    priority = request.args.get('priority', '').strip()
    employee_id = request.args.get('employee_id', '').strip()

    query = Task.query

    # Enforce role-based access
    if current_user.role == 'user':
        emp_id = get_linked_employee_id(current_user)
        if not emp_id:
            # Regular user without linked employee record has no assigned tasks
            return success_response(data=[], message="No tasks assigned to your profile.")
        query = query.filter(Task.employee_id == emp_id)
    else:
        # Admin can filter by specific employee
        if employee_id:
            try:
                emp_id_int = int(employee_id)
                query = query.filter(Task.employee_id == emp_id_int)
            except ValueError:
                pass

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Task.title.ilike(term),
                Task.description.ilike(term)
            )
        )

    if status and status in Task.VALID_STATUSES:
        query = query.filter(Task.status == status)

    if priority and priority in Task.VALID_PRIORITIES:
        query = query.filter(Task.priority == priority)

    # Order by due date ascending
    tasks = query.order_by(Task.due_date.asc(), Task.id.desc()).all()
    return success_response(
        data=[t.to_dict() for t in tasks],
        message=f"Retrieved {len(tasks)} task(s)."
    )

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@token_required
def get_task(current_user, task_id):
    """Retrieve a single task by ID with role check."""
    task = db.session.get(Task, task_id)
    if not task:
        return error_response(f"Task with ID {task_id} not found.", status_code=404)

    # Regular user can only view their own assigned task
    if current_user.role == 'user':
        emp_id = get_linked_employee_id(current_user)
        if task.employee_id != emp_id:
            return error_response("Access forbidden: You can only view tasks assigned to you.", status_code=403)

    return success_response(data=task.to_dict())

@tasks_bp.route('', methods=['POST'])
@token_required
@admin_required
def create_task(current_user):
    """Create a new task with optional employee assignment (Admin only)."""
    data = request.get_json() or {}
    validation_errors = validate_task_data(data, is_update=False)
    if validation_errors:
        return error_response("Validation failed.", errors=validation_errors, status_code=400)

    # Validate employee assignment if provided
    employee_id = data.get('employee_id')
    if employee_id not in [None, '', 0]:
        try:
            employee_id = int(employee_id)
            employee = db.session.get(Employee, employee_id)
            if not employee:
                return error_response(f"Cannot assign task: Employee with ID {employee_id} does not exist.", status_code=400)
        except (ValueError, TypeError):
            return error_response("Invalid employee_id format. Must be an integer.", status_code=400)
    else:
        employee_id = None

    due_date_str = str(data['due_date'])[:10]
    parsed_due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()

    task = Task(
        title=data['title'].strip(),
        description=data.get('description', '').strip(),
        employee_id=employee_id,
        priority=data['priority'],
        status=data.get('status', 'Pending'),
        due_date=parsed_due_date
    )

    try:
        db.session.add(task)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while creating task: {str(e)}", status_code=500)

    # Trigger notification if assigned
    if employee_id:
        try:
            notify_task_assigned(task, employee_id)
        except Exception:
            pass

    return success_response(
        data=task.to_dict(),
        message="Task created successfully.",
        status_code=201
    )

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@token_required
@admin_required
def update_task(current_user, task_id):
    """Update an existing task (Admin only)."""
    task = db.session.get(Task, task_id)
    if not task:
        return error_response(f"Task with ID {task_id} not found.", status_code=404)

    data = request.get_json() or {}
    validation_errors = validate_task_data(data, is_update=True)
    if validation_errors:
        return error_response("Validation failed.", errors=validation_errors, status_code=400)

    old_employee_id = task.employee_id
    old_status = task.status
    assigned_changed = False

    # Handle employee assignment
    if 'employee_id' in data:
        emp_id = data.get('employee_id')
        if emp_id not in [None, '', 0]:
            try:
                emp_id = int(emp_id)
                employee = db.session.get(Employee, emp_id)
                if not employee:
                    return error_response(f"Cannot assign task: Employee with ID {emp_id} does not exist.", status_code=400)
                if task.employee_id != emp_id:
                    assigned_changed = True
                task.employee_id = emp_id
            except (ValueError, TypeError):
                return error_response("Invalid employee_id format.", status_code=400)
        else:
            task.employee_id = None

    if 'title' in data:
        task.title = data['title'].strip()
    if 'description' in data:
        task.description = data['description'].strip()
    if 'priority' in data:
        task.priority = data['priority']
    if 'status' in data:
        task.status = data['status']
    if 'due_date' in data and data['due_date']:
        due_date_str = str(data['due_date'])[:10]
        task.due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while updating task: {str(e)}", status_code=500)

    # Notifications
    try:
        if assigned_changed and task.employee_id:
            notify_task_assigned(task, task.employee_id)
        if old_status != task.status:
            notify_task_status_updated(task, old_status, task.status, current_user)
    except Exception:
        pass

    return success_response(
        data=task.to_dict(),
        message="Task updated successfully."
    )

@tasks_bp.route('/<int:task_id>/status', methods=['PATCH'])
@token_required
def update_task_status(current_user, task_id):
    """
    Convenience endpoint to quickly update just the status of a task.
    Allowed for:
    - Admins
    - Regular users assigned to this task
    """
    task = db.session.get(Task, task_id)
    if not task:
        return error_response(f"Task with ID {task_id} not found.", status_code=404)

    # Role permission check:
    if current_user.role == 'user':
        emp_id = get_linked_employee_id(current_user)
        if not emp_id or task.employee_id != emp_id:
            return error_response("Access forbidden: You can only update the status of tasks assigned to you.", status_code=403)

    data = request.get_json() or {}
    new_status = data.get('status')
    if not new_status or new_status not in Task.VALID_STATUSES:
        return error_response(f"Invalid status '{new_status}'. Allowed values: {', '.join(Task.VALID_STATUSES)}", status_code=400)

    old_status = task.status
    task.status = new_status
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while updating status: {str(e)}", status_code=500)

    try:
        notify_task_status_updated(task, old_status, new_status, current_user)
    except Exception:
        pass

    return success_response(
        data=task.to_dict(),
        message=f"Task status updated to '{new_status}'."
    )

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_task(current_user, task_id):
    """Delete a task (Admin only)."""
    task = db.session.get(Task, task_id)
    if not task:
        return error_response(f"Task with ID {task_id} not found.", status_code=404)

    try:
        db.session.delete(task)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while deleting task: {str(e)}", status_code=500)

    return success_response(message=f"Task '{task.title}' deleted successfully.")
