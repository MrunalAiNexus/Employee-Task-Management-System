from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    """Notification model for user alerts (task assignments, status changes, due soon)."""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50), nullable=False, default='SYSTEM')  # 'TASK_ASSIGNED', 'STATUS_UPDATED', 'DUE_SOON', 'SYSTEM'
    is_read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    task = db.relationship('Task', backref=db.backref('notifications', lazy=True))

    def to_dict(self):
        """Serialize notification object."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'task_id': self.task_id,
            'task_title': self.task.title if self.task else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Notification id={self.id} user_id={self.user_id} title="{self.title}" is_read={self.is_read}>'
