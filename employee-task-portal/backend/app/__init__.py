import os
from flask import Flask, jsonify
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.config import config_by_name
from app.extensions import db, cors
from app.utils.response import error_response

def create_app(config_name=None):
    """Application factory for the Flask backend."""
    if not config_name:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS - allow Angular frontend origin
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.employees import employees_bp
    from app.routes.tasks import tasks_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(notifications_bp)

    # Root API health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Employee Task Management Portal API',
            'version': '1.0.0'
        }), 200

    # Centralized Error Handlers
    @app.errorhandler(400)
    def handle_bad_request(e):
        return error_response(str(e.description or "Bad request"), status_code=400)

    @app.errorhandler(401)
    def handle_unauthorized(e):
        return error_response(str(e.description or "Unauthorized access"), status_code=401)

    @app.errorhandler(403)
    def handle_forbidden(e):
        return error_response(str(e.description or "Forbidden action"), status_code=403)

    @app.errorhandler(404)
    def handle_not_found(e):
        return error_response(str(e.description or "Resource not found"), status_code=404)

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return error_response("HTTP method not allowed for this endpoint.", status_code=405)

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        db.session.rollback()
        return error_response("Database integrity constraint violation (e.g. duplicate key or foreign key violation).", status_code=409)

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(e):
        db.session.rollback()
        return error_response(f"Database operation error: {str(e)}", status_code=500)

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        db.session.rollback()
        return error_response("An internal server error occurred. Please try again later.", status_code=500)

    return app
