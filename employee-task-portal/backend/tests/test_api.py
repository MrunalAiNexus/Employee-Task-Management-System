import json
from datetime import date, timedelta

def test_login_success(client):
    """Test successful user login with valid credentials."""
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'Admin@123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'token' in data['data']
    assert data['data']['user']['username'] == 'admin'

def test_login_invalid_credentials(client):
    """Test login rejection when using invalid password."""
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'WrongPassword999'
    })
    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] is False

def test_employee_creation(client, auth_headers):
    """Test creating a new employee with valid payload."""
    payload = {
        'name': 'Charlie Davis',
        'email': 'charlie@test.com',
        'department': 'Marketing',
        'role': 'Content Strategist'
    }
    response = client.post('/api/employees', json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['name'] == 'Charlie Davis'
    assert data['data']['email'] == 'charlie@test.com'
    assert 'id' in data['data']

def test_employee_duplicate_email(client, auth_headers):
    """Test that creating an employee with a duplicate email fails with 409."""
    payload = {
        'name': 'Duplicate Person',
        'email': 'alice@test.com',  # Alice already seeded in fixture
        'department': 'Engineering',
        'role': 'Developer'
    }
    response = client.post('/api/employees', json=payload, headers=auth_headers)
    assert response.status_code == 409
    data = response.get_json()
    assert data['success'] is False

def test_employee_retrieval_and_search(client, auth_headers):
    """Test retrieving employee list and searching by keyword."""
    # Retrieve all
    response = client.get('/api/employees', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['data']) >= 2

    # Search for 'Alice'
    search_res = client.get('/api/employees?search=Alice', headers=auth_headers)
    assert search_res.status_code == 200
    search_data = search_res.get_json()
    assert len(search_data['data']) == 1
    assert search_data['data'][0]['name'] == 'Alice Smith'

def test_employee_update_and_delete(client, auth_headers):
    """Test updating and deleting an employee record."""
    # Update Bob
    update_res = client.put('/api/employees/2', json={
        'name': 'Robert Jones',
        'department': 'Product Design'
    }, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['name'] == 'Robert Jones'

    # Delete Bob
    del_res = client.delete('/api/employees/2', headers=auth_headers)
    assert del_res.status_code == 200

    # Verify not found
    get_res = client.get('/api/employees/2', headers=auth_headers)
    assert get_res.status_code == 404

def test_task_creation_and_assignment(client, auth_headers):
    """Test task creation and assignment to an existing employee."""
    due = (date.today() + timedelta(days=5)).isoformat()
    payload = {
        'title': 'Write Integration Tests',
        'description': 'Cover critical endpoints with pytest',
        'employee_id': 1,
        'priority': 'High',
        'status': 'In Progress',
        'due_date': due
    }
    response = client.post('/api/tasks', json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['employee_name'] == 'Alice Smith'
    assert data['data']['priority'] == 'High'

def test_task_assignment_to_nonexistent_employee(client, auth_headers):
    """Test that assigning a task to an invalid employee ID fails with 400."""
    due = (date.today() + timedelta(days=3)).isoformat()
    payload = {
        'title': 'Ghost Task',
        'employee_id': 9999,  # Does not exist
        'priority': 'Medium',
        'status': 'Pending',
        'due_date': due
    }
    response = client.post('/api/tasks', json=payload, headers=auth_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False

def test_task_status_update(client, auth_headers):
    """Test updating a task's status."""
    due = (date.today() + timedelta(days=2)).isoformat()
    create_res = client.post('/api/tasks', json={
        'title': 'Deploy to Cloud',
        'employee_id': 1,
        'priority': 'High',
        'status': 'Pending',
        'due_date': due
    }, headers=auth_headers)
    task_id = create_res.get_json()['data']['id']

    # Update status to 'Completed' via PATCH
    patch_res = client.patch(f'/api/tasks/{task_id}/status', json={
        'status': 'Completed'
    }, headers=auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.get_json()['data']['status'] == 'Completed'

def test_task_filtering_and_search(client, auth_headers):
    """Test filtering tasks by status and priority."""
    today_str = date.today().isoformat()
    # Create 2 tasks
    client.post('/api/tasks', json={
        'title': 'Urgent Security Audit',
        'employee_id': 1,
        'priority': 'High',
        'status': 'Pending',
        'due_date': today_str
    }, headers=auth_headers)

    client.post('/api/tasks', json={
        'title': 'Update Documentation',
        'employee_id': 1,
        'priority': 'Low',
        'status': 'Completed',
        'due_date': today_str
    }, headers=auth_headers)

    # Filter status=Pending
    pending_res = client.get('/api/tasks?status=Pending', headers=auth_headers)
    assert pending_res.status_code == 200
    pending_items = pending_res.get_json()['data']
    assert all(item['status'] == 'Pending' for item in pending_items)

    # Filter priority=High
    high_res = client.get('/api/tasks?priority=High', headers=auth_headers)
    assert high_res.status_code == 200
    high_items = high_res.get_json()['data']
    assert all(item['priority'] == 'High' for item in high_items)

def test_dashboard_stats(client, auth_headers):
    """Test retrieving dashboard statistics."""
    response = client.get('/api/dashboard/stats', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'total_employees' in data['data']
    assert 'total_tasks' in data['data']
    assert 'pending_tasks' in data['data']
    assert 'completed_tasks' in data['data']

def test_role_based_permissions_regular_user_cannot_create_employee(client, user_auth_headers):
    """Test that a regular user cannot create an employee record (403 Forbidden)."""
    payload = {
        'name': 'Hacker Person',
        'email': 'hacker@test.com',
        'department': 'Operations',
        'role': 'Coordinator'
    }
    res = client.post('/api/employees', json=payload, headers=user_auth_headers)
    assert res.status_code == 403
    assert res.get_json()['success'] is False

def test_role_based_permissions_regular_user_cannot_create_or_delete_task(client, user_auth_headers):
    """Test that a regular user cannot create or delete a task (403 Forbidden)."""
    due = (date.today() + timedelta(days=2)).isoformat()
    # Attempt create
    create_res = client.post('/api/tasks', json={
        'title': 'Unauthorized Task',
        'employee_id': 1,
        'priority': 'Low',
        'due_date': due
    }, headers=user_auth_headers)
    assert create_res.status_code == 403

    # Attempt delete
    del_res = client.delete('/api/tasks/1', headers=user_auth_headers)
    assert del_res.status_code == 403

def test_regular_user_assigned_tasks_and_status_update(client, auth_headers, user_auth_headers):
    """Test that a regular user can view only their own assigned tasks and update their status."""
    due = (date.today() + timedelta(days=3)).isoformat()
    # Admin assigns task 1 to Alice (id 1)
    t1_res = client.post('/api/tasks', json={
        'title': 'Alice Task',
        'employee_id': 1,
        'priority': 'High',
        'status': 'Pending',
        'due_date': due
    }, headers=auth_headers)
    t1_id = t1_res.get_json()['data']['id']

    # Admin assigns task 2 to Bob (id 2)
    t2_res = client.post('/api/tasks', json={
        'title': 'Bob Task',
        'employee_id': 2,
        'priority': 'Low',
        'status': 'Pending',
        'due_date': due
    }, headers=auth_headers)
    t2_id = t2_res.get_json()['data']['id']

    # Alice queries tasks - should only see Alice Task
    alice_tasks_res = client.get('/api/tasks', headers=user_auth_headers)
    assert alice_tasks_res.status_code == 200
    alice_tasks = alice_tasks_res.get_json()['data']
    task_ids = [t['id'] for t in alice_tasks]
    assert t1_id in task_ids
    assert t2_id not in task_ids

    # Alice can update status of her assigned task
    update_res = client.patch(f'/api/tasks/{t1_id}/status', json={'status': 'In Progress'}, headers=user_auth_headers)
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['status'] == 'In Progress'

    # Alice CANNOT update status of Bob's task (403)
    bob_update_res = client.patch(f'/api/tasks/{t2_id}/status', json={'status': 'Completed'}, headers=user_auth_headers)
    assert bob_update_res.status_code == 403

def test_notifications_on_task_assignment_and_status_update(client, auth_headers, user_auth_headers):
    """Test that task assignment and status updates generate notifications for the user."""
    due = (date.today() + timedelta(days=1)).isoformat()
    # Admin creates task assigned to Alice
    create_res = client.post('/api/tasks', json={
        'title': 'Audit Server Logs',
        'employee_id': 1,
        'priority': 'High',
        'status': 'Pending',
        'due_date': due
    }, headers=auth_headers)
    assert create_res.status_code == 201
    task_id = create_res.get_json()['data']['id']

    # Check Alice's notifications
    notif_res = client.get('/api/notifications', headers=user_auth_headers)
    assert notif_res.status_code == 200
    notif_data = notif_res.get_json()['data']
    assert notif_data['unread_count'] >= 1
    notifications = notif_data['notifications']
    assigned_notif = next((n for n in notifications if n['type'] == 'TASK_ASSIGNED'), None)
    assert assigned_notif is not None
    assert 'Audit Server Logs' in assigned_notif['title']

    # Mark as read
    read_res = client.patch(f'/api/notifications/{assigned_notif["id"]}/read', headers=user_auth_headers)
    assert read_res.status_code == 200
    assert read_res.get_json()['data']['notification']['is_read'] is True

    # Mark all read
    mark_all_res = client.post('/api/notifications/mark-all-read', headers=user_auth_headers)
    assert mark_all_res.status_code == 200
    assert mark_all_res.get_json()['data']['unread_count'] == 0
