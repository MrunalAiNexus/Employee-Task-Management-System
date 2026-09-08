from flask import Blueprint, request
from app.extensions import db
from app.models.notification import Notification
from app.utils.auth_decorator import token_required
from app.utils.response import success_response, error_response
from app.services.notification_service import check_and_generate_due_soon_alerts

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user):
    """Retrieve all notifications for the current authenticated user."""
    # Check for any tasks that are due soon and alert the user
    try:
        check_and_generate_due_soon_alerts()
    except Exception:
        db.session.rollback()

    notifications = Notification.query.filter_by(user_id=current_user.id)\
        .order_by(Notification.created_at.desc())\
        .limit(50)\
        .all()

    unread_count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()

    return success_response({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    })

@notifications_bp.route('/<int:notification_id>/read', methods=['PATCH'])
@token_required
def mark_notification_read(current_user, notification_id):
    """Mark a specific notification as read."""
    notification = db.session.get(Notification, notification_id)
    if not notification:
        return error_response(f"Notification with ID {notification_id} not found.", status_code=404)

    if notification.user_id != current_user.id and current_user.role != 'admin':
        return error_response("Forbidden: You cannot modify this notification.", status_code=403)

    notification.is_read = True
    db.session.commit()

    unread_count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return success_response({
        'notification': notification.to_dict(),
        'unread_count': unread_count
    }, message="Notification marked as read.")

@notifications_bp.route('/mark-all-read', methods=['POST'])
@token_required
def mark_all_read(current_user):
    """Mark all unread notifications for the current user as read."""
    Notification.query.filter_by(user_id=current_user.id, is_read=False)\
        .update({Notification.is_read: True})
    db.session.commit()

    return success_response({
        'unread_count': 0
    }, message="All notifications marked as read.")

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    """Delete a notification."""
    notification = db.session.get(Notification, notification_id)
    if not notification:
        return error_response(f"Notification with ID {notification_id} not found.", status_code=404)

    if notification.user_id != current_user.id and current_user.role != 'admin':
        return error_response("Forbidden: You cannot delete this notification.", status_code=403)

    db.session.delete(notification)
    db.session.commit()

    return success_response(None, message="Notification deleted.")
