from flask import Blueprint, request
from app.models.user import User
from app.utils.response import success_response, error_response
from app.utils.auth_decorator import generate_token, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user with username/email and password."""
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('email')
    password = data.get('password')

    if not identifier or not str(identifier).strip():
        return error_response("Username or email is required.", status_code=400)
    if not password or not str(password).strip():
        return error_response("Password is required.", status_code=400)

    identifier = str(identifier).strip()

    # Query user by username or email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not user.check_password(password):
        return error_response("Invalid username/email or password.", status_code=401)

    if not user.is_active:
        return error_response("This account has been disabled.", status_code=403)

    token = generate_token(user)

    return success_response(
        data={
            'token': token,
            'user': user.to_dict()
        },
        message="Login successful."
    )

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Return currently authenticated user profile."""
    return success_response(data={'user': current_user.to_dict()})
