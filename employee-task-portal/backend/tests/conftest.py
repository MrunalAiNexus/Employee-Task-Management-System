import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.employee import Employee
from app.models.task import Task
from app.utils.auth_decorator import generate_token

@pytest.fixture
def app():
    """Create and configure a testing instance of the Flask app with SQLite in-memory DB."""
    test_app = create_app('testing')
    
    with test_app.app_context():
        db.create_all()
        # Seed test admin user
        admin = User(username='admin', email='admin@test.com', role='admin')
        admin.set_password('Admin@123')
        db.session.add(admin)

        # Seed sample employee
        emp1 = Employee(name='Alice Smith', email='alice@test.com', department='Engineering', role='Software Engineer')
        emp2 = Employee(name='Bob Jones', email='bob@test.com', department='Design', role='Product Designer')
        db.session.add_all([emp1, emp2])
        db.session.commit()

        # Seed regular user linked to emp1 (Alice)
        alice_user = User(username='alice', email='alice@test.com', role='user', employee_id=emp1.id)
        alice_user.set_password('Alice@123')
        db.session.add(alice_user)
        db.session.commit()

        yield test_app

        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client for invoking HTTP requests."""
    return app.test_client()

@pytest.fixture
def auth_headers(app):
    """Generate authorization headers with valid JWT token for the test admin."""
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        token = generate_token(admin)
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

@pytest.fixture
def user_auth_headers(app):
    """Generate authorization headers with valid JWT token for regular user Alice."""
    with app.app_context():
        user = User.query.filter_by(username='alice').first()
        token = generate_token(user)
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
