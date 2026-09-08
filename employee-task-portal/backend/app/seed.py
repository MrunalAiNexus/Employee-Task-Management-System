from datetime import date, timedelta
from app.extensions import db
from app.models.user import User
from app.models.employee import Employee
from app.models.task import Task

def seed_database():
    """Seed the database with demo users, employees, and tasks."""
    # 1. Seed Users (if not already seeded)
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@portal.com',
            role='admin'
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

    dev_user = User.query.filter_by(username='developer').first()
    if not dev_user:
        dev_user = User(
            username='developer',
            email='developer@portal.com',
            role='user'
        )
        dev_user.set_password('Admin@123')
        db.session.add(dev_user)

    db.session.commit()

    # 2. Seed Employees
    if Employee.query.count() == 0:
        employees_data = [
            {'name': 'Sarah Jenkins', 'email': 'sarah.jenkins@company.com', 'department': 'Engineering', 'role': 'Senior Full-Stack Engineer'},
            {'name': 'David Chen', 'email': 'david.chen@company.com', 'department': 'Engineering', 'role': 'Backend Developer'},
            {'name': 'Elena Rostova', 'email': 'elena.rostova@company.com', 'department': 'Product', 'role': 'Product Manager'},
            {'name': 'Marcus Brody', 'email': 'marcus.brody@company.com', 'department': 'Design', 'role': 'UI/UX Designer'},
            {'name': 'Priya Patel', 'email': 'priya.patel@company.com', 'department': 'Quality Assurance', 'role': 'QA Automation Engineer'}
        ]

        created_employees = []
        for emp_info in employees_data:
            emp = Employee(**emp_info)
            db.session.add(emp)
            created_employees.append(emp)

        db.session.commit()

        # 3. Seed Tasks
        today = date.today()
        tasks_data = [
            {
                'title': 'Build Authentication Service',
                'description': 'Implement JWT token generation, password hashing, and user authentication API endpoints.',
                'employee_id': created_employees[0].id,
                'priority': 'High',
                'status': 'Completed',
                'due_date': today - timedelta(days=2)
            },
            {
                'title': 'Design Responsive Dashboard UI',
                'description': 'Create responsive stat cards, navigation sidebar, and task progress indicators in Angular.',
                'employee_id': created_employees[3].id,
                'priority': 'High',
                'status': 'In Progress',
                'due_date': today + timedelta(days=3)
            },
            {
                'title': 'Implement MySQL Schema & Migrations',
                'description': 'Define relational tables for users, employees, and tasks with foreign keys and indexes.',
                'employee_id': created_employees[1].id,
                'priority': 'Medium',
                'status': 'Completed',
                'due_date': today - timedelta(days=4)
            },
            {
                'title': 'Automate E2E Test Suite',
                'description': 'Write automated tests for task creation, employee CRUD, and status filtering workflows.',
                'employee_id': created_employees[4].id,
                'priority': 'Medium',
                'status': 'Pending',
                'due_date': today + timedelta(days=5)
            },
            {
                'title': 'Draft Product Roadmap Q3',
                'description': 'Finalize MVP feature list, gather feedback from stakeholders, and prioritize backlog.',
                'employee_id': created_employees[2].id,
                'priority': 'Low',
                'status': 'In Progress',
                'due_date': today + timedelta(days=7)
            },
            {
                'title': 'Setup CORS and Security Headers',
                'description': 'Configure CORS origins, rate limits, and sanitize user inputs across REST endpoints.',
                'employee_id': created_employees[1].id,
                'priority': 'Medium',
                'status': 'Pending',
                'due_date': today + timedelta(days=4)
            }
        ]

        for task_info in tasks_data:
            task = Task(**task_info)
            db.session.add(task)

        db.session.commit()
