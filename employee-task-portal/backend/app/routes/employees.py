from flask import Blueprint, request
from sqlalchemy import or_
from app.extensions import db
from app.models.employee import Employee
from app.utils.response import success_response, error_response
from app.utils.validators import validate_employee_data
from app.utils.auth_decorator import token_required, admin_required

employees_bp = Blueprint('employees', __name__, url_prefix='/api/employees')

@employees_bp.route('', methods=['GET'])
@token_required
def get_employees(current_user):
    """List employees with optional search query across name, email, department, or role."""
    search_query = request.args.get('search', '').strip()
    query = Employee.query

    if search_query:
        term = f"%{search_query}%"
        query = query.filter(
            or_(
                Employee.name.ilike(term),
                Employee.email.ilike(term),
                Employee.department.ilike(term),
                Employee.role.ilike(term)
            )
        )

    employees = query.order_by(Employee.name.asc()).all()
    return success_response(
        data=[emp.to_dict() for emp in employees],
        message=f"Retrieved {len(employees)} employee(s)."
    )

@employees_bp.route('/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(current_user, employee_id):
    """Retrieve a single employee by ID, including assigned tasks."""
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return error_response(f"Employee with ID {employee_id} not found.", status_code=404)

    return success_response(data=employee.to_dict(include_tasks=True))

@employees_bp.route('', methods=['POST'])
@token_required
@admin_required
def create_employee(current_user):
    """Create a new employee record."""
    data = request.get_json() or {}
    validation_errors = validate_employee_data(data, is_update=False)
    if validation_errors:
        return error_response("Validation failed.", errors=validation_errors, status_code=400)

    email = data['email'].strip().lower()

    # Check if email is already used
    existing = Employee.query.filter_by(email=email).first()
    if existing:
        return error_response(f"An employee with email '{email}' already exists.", status_code=409)

    employee = Employee(
        name=data['name'].strip(),
        email=email,
        department=data['department'].strip(),
        role=data['role'].strip()
    )

    try:
        db.session.add(employee)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while creating employee: {str(e)}", status_code=500)

    return success_response(
        data=employee.to_dict(),
        message="Employee created successfully.",
        status_code=201
    )

@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@token_required
@admin_required
def update_employee(current_user, employee_id):
    """Update an existing employee record."""
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return error_response(f"Employee with ID {employee_id} not found.", status_code=404)

    data = request.get_json() or {}
    validation_errors = validate_employee_data(data, is_update=True)
    if validation_errors:
        return error_response("Validation failed.", errors=validation_errors, status_code=400)

    if 'email' in data:
        email = data['email'].strip().lower()
        existing = Employee.query.filter(Employee.email == email, Employee.id != employee_id).first()
        if existing:
            return error_response(f"An employee with email '{email}' already exists.", status_code=409)
        employee.email = email

    if 'name' in data:
        employee.name = data['name'].strip()
    if 'department' in data:
        employee.department = data['department'].strip()
    if 'role' in data:
        employee.role = data['role'].strip()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while updating employee: {str(e)}", status_code=500)

    return success_response(
        data=employee.to_dict(),
        message="Employee updated successfully."
    )

@employees_bp.route('/<int:employee_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_employee(current_user, employee_id):
    """Delete an employee. Associated tasks have their employee_id set to NULL or cascade."""
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return error_response(f"Employee with ID {employee_id} not found.", status_code=404)

    try:
        db.session.delete(employee)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error while deleting employee: {str(e)}", status_code=500)

    return success_response(message=f"Employee '{employee.name}' deleted successfully.")
