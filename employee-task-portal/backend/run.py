import os
from app import create_app
from app.extensions import db
from app.seed import seed_database

# Determine environment configuration from environment variable
env_mode = os.getenv('FLASK_ENV', 'development')
app = create_app(env_mode)

@app.cli.command('seed-db')
def seed_db_command():
    """CLI command to seed the database with demo users, employees, and tasks."""
    with app.app_context():
        seed_database()
        print("Database seeded successfully!")

@app.cli.command('init-db')
def init_db_command():
    """CLI command to create all tables and populate initial demo data."""
    with app.app_context():
        db.create_all()
        seed_database()
        print("Database initialized and seeded successfully!")

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', '1') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)
