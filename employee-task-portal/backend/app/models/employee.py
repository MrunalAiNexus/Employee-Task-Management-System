from datetime import datetime
from app.extensions import db

class Employee(db.Model):
    """Employee model representing organizational staff."""
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    department = db.Column(db.String(80), nullable=False, index=True)
    role = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to tasks: An employee can have many tasks.
    # When employee is deleted, assigned tasks' employee_id is set to NULL (or cascaded)
    tasks = db.relationship('Task', backref='employee', lazy='select', cascade='all, delete-orphan', passive_deletes=False)

    def to_dict(self, include_tasks=False):
        """Serialize employee object."""
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'tasks_count': len(self.tasks) if self.tasks else 0
        }
        if include_tasks:
            data['tasks'] = [t.to_dict() for t in self.tasks]
        return data

    def __repr__(self):
        return f'<Employee id={self.id} name="{self.name}" email="{self.email}">'
