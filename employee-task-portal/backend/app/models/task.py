from datetime import datetime, date
from app.extensions import db

class Task(db.Model):
    """Task model representing assignable work items."""
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='SET NULL'), nullable=True, index=True)
    priority = db.Column(db.String(20), nullable=False, default='Medium', index=True)  # 'Low', 'Medium', 'High'
    status = db.Column(db.String(30), nullable=False, default='Pending', index=True)   # 'Pending', 'In Progress', 'Completed'
    due_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    VALID_PRIORITIES = ['Low', 'Medium', 'High']
    VALID_STATUSES = ['Pending', 'In Progress', 'Completed']

    def to_dict(self):
        """Serialize task object with associated employee information."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'employee_id': self.employee_id,
            'employee_name': self.employee.name if self.employee else None,
            'employee_email': self.employee.email if self.employee else None,
            'priority': self.priority,
            'status': self.status,
            'due_date': self.due_date.isoformat() if isinstance(self.due_date, (date, datetime)) else str(self.due_date),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Task id={self.id} title="{self.title}" status="{self.status}" priority="{self.priority}">'
