import re
from datetime import datetime

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def is_valid_email(email: str) -> bool:
    """Validate standard email format."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def validate_employee_data(data: dict, is_update=False):
    """Validate incoming payload for employee creation/update."""
    errors = []

    if not is_update or 'name' in data:
        name = data.get('name')
        if not name or not str(name).strip():
            errors.append("Employee 'name' is required and cannot be empty.")
        elif len(str(name).strip()) > 100:
            errors.append("Employee 'name' must not exceed 100 characters.")

    if not is_update or 'email' in data:
        email = data.get('email')
        if not email or not str(email).strip():
            errors.append("Employee 'email' is required.")
        elif not is_valid_email(str(email).strip()):
            errors.append("Employee 'email' is not in a valid format.")
        elif len(str(email).strip()) > 120:
            errors.append("Employee 'email' must not exceed 120 characters.")

    if not is_update or 'department' in data:
        dept = data.get('department')
        if not dept or not str(dept).strip():
            errors.append("Employee 'department' is required.")
        elif len(str(dept).strip()) > 80:
            errors.append("Employee 'department' must not exceed 80 characters.")

    if not is_update or 'role' in data:
        role = data.get('role')
        if not role or not str(role).strip():
            errors.append("Employee 'role' is required.")
        elif len(str(role).strip()) > 80:
            errors.append("Employee 'role' must not exceed 80 characters.")

    return errors

def validate_task_data(data: dict, is_update=False):
    """Validate incoming payload for task creation/update."""
    errors = []
    valid_priorities = ['Low', 'Medium', 'High']
    valid_statuses = ['Pending', 'In Progress', 'Completed']

    if not is_update or 'title' in data:
        title = data.get('title')
        if not title or not str(title).strip():
            errors.append("Task 'title' is required and cannot be empty.")
        elif len(str(title).strip()) > 200:
            errors.append("Task 'title' must not exceed 200 characters.")

    if 'priority' in data:
        priority = data.get('priority')
        if priority not in valid_priorities:
            errors.append(f"Invalid priority '{priority}'. Allowed values: {', '.join(valid_priorities)}")
    elif not is_update:
        errors.append("Task 'priority' is required (Low, Medium, or High).")

    if 'status' in data:
        status = data.get('status')
        if status not in valid_statuses:
            errors.append(f"Invalid status '{status}'. Allowed values: {', '.join(valid_statuses)}")
    elif not is_update:
        # Default status is allowed as Pending, but if given must be valid
        pass

    if not is_update or 'due_date' in data:
        due_date = data.get('due_date')
        if not due_date:
            errors.append("Task 'due_date' is required (YYYY-MM-DD format).")
        else:
            try:
                datetime.strptime(str(due_date)[:10], '%Y-%m-%d')
            except ValueError:
                errors.append("Invalid 'due_date' format. Must be YYYY-MM-DD.")

    return errors
