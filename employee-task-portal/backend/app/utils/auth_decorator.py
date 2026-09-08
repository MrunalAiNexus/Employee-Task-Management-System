from functools import wraps
from datetime import datetime, timezone
import jwt
from flask import request, current_app
from app.extensions import db
from app.models.user import User
from app.utils.response import error_response

def generate_token(user: User) -> str:
    """Generate a JWT token for an authenticated user."""
    payload = {
        'sub': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_EXPIRATION_DELTA'],
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to require valid JWT Authorization Bearer header for protected endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response("Authentication token is missing. Please log in.", status_code=401)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return error_response("Invalid Authorization header format. Expected 'Bearer <token>'.", status_code=401)

        token = parts[1]

        # For testing convenience, allow 'demo-token-bypass' if configured or in test mode
        if current_app.config.get('TESTING') and token == 'test-admin-token':
            # Mock admin user
            current_user = User.query.filter_by(role='admin').first()
            return f(current_user=current_user, *args, **kwargs)

        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, payload['sub'])
            if not current_user or not current_user.is_active:
                return error_response("User account is inactive or no longer exists.", status_code=401)
        except jwt.ExpiredSignatureError:
            return error_response("Authentication token has expired. Please log in again.", status_code=401)
        except (jwt.InvalidTokenError, Exception):
            return error_response("Invalid authentication token.", status_code=401)

        return f(current_user=current_user, *args, **kwargs)

    return decorated

def admin_required(f):
    """Decorator to require that the authenticated user has the 'admin' role.
    Must be placed after @token_required.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = kwargs.get('current_user')
        if not current_user:
            return error_response("Authentication required.", status_code=401)
        if current_user.role != 'admin':
            return error_response("Access forbidden: Administrator privileges required.", status_code=403)
        return f(*args, **kwargs)

    return decorated
