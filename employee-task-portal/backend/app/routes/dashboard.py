from flask import Blueprint
from sqlalchemy import func
from app.models.employee import Employee
from app.models.task import Task
from app.utils.response import success_response
from app.utils.auth_decorator import token_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    """Return aggregated metrics and statistics for the dashboard (role-aware)."""
    if current_user.role == 'user':
        emp_id = current_user.employee_id
        if not emp_id and current_user.email:
            emp = Employee.query.filter_by(email=current_user.email).first()
            if emp:
                emp_id = emp.id

        task_query = Task.query.filter(Task.employee_id == emp_id) if emp_id else Task.query.filter(Task.id == -1)
        total_tasks = task_query.count()
        pending_tasks = task_query.filter(Task.status == 'Pending').count()
        in_progress_tasks = task_query.filter(Task.status == 'In Progress').count()
        completed_tasks = task_query.filter(Task.status == 'Completed').count()
        high_priority = task_query.filter(Task.priority == 'High').count()
        medium_priority = task_query.filter(Task.priority == 'Medium').count()
        low_priority = task_query.filter(Task.priority == 'Low').count()
        recent_tasks = task_query.order_by(Task.due_date.asc()).limit(5).all()

        return success_response(
            data={
                'role': 'user',
                'total_employees': 1,
                'total_tasks': total_tasks,
                'pending_tasks': pending_tasks,
                'in_progress_tasks': in_progress_tasks,
                'completed_tasks': completed_tasks,
                'priority_breakdown': {
                    'high': high_priority,
                    'medium': medium_priority,
                    'low': low_priority
                },
                'department_distribution': [],
                'recent_tasks': [t.to_dict() for t in recent_tasks]
            },
            message="User task statistics retrieved successfully."
        )

    # Admin view
    total_employees = Employee.query.count()
    total_tasks = Task.query.count()
    pending_tasks = Task.query.filter_by(status='Pending').count()
    in_progress_tasks = Task.query.filter_by(status='In Progress').count()
    completed_tasks = Task.query.filter_by(status='Completed').count()

    # Priority breakdown
    high_priority = Task.query.filter_by(priority='High').count()
    medium_priority = Task.query.filter_by(priority='Medium').count()
    low_priority = Task.query.filter_by(priority='Low').count()

    # Recent 5 tasks ordered by updated_at / created_at desc
    recent_tasks = Task.query.order_by(Task.created_at.desc()).limit(5).all()

    # Department breakdown (for chart)
    dept_stats = (
        Employee.query.with_entities(Employee.department, func.count(Employee.id))
        .group_by(Employee.department)
        .all()
    )
    departments = [{'department': dept, 'count': count} for dept, count in dept_stats]

    return success_response(
        data={
            'role': 'admin',
            'total_employees': total_employees,
            'total_tasks': total_tasks,
            'pending_tasks': pending_tasks,
            'in_progress_tasks': in_progress_tasks,
            'completed_tasks': completed_tasks,
            'priority_breakdown': {
                'high': high_priority,
                'medium': medium_priority,
                'low': low_priority
            },
            'department_distribution': departments,
            'recent_tasks': [t.to_dict() for t in recent_tasks]
        },
        message="Dashboard statistics retrieved successfully."
    )
