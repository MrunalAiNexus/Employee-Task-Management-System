-- ==========================================================
-- Employee Task Management Portal - Database Schema (MySQL)
-- Version: 1.0 (Production MVP)
-- ==========================================================

-- 1. Create Database (if not exists)
CREATE DATABASE IF NOT EXISTS employee_task_portal
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE employee_task_portal;

-- 2. Drop tables in reverse order of dependencies (if re-initializing)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- Table: users
-- Purpose: System authentication, role-based access control
-- Passwords stored using Werkzeug pbkdf2 / scrypt hashing
-- ==========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    employee_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table: employees
-- Purpose: Employee directory and organizational records
-- ==========================================================
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    department VARCHAR(80) NOT NULL,
    role VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employees_department (department),
    INDEX idx_employees_email (email),
    INDEX idx_employees_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key from users to employees if linked
ALTER TABLE users
    ADD CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ==========================================================
-- Table: tasks
-- Purpose: Task assignment, status tracking, and priority management
-- Foreign Key: employee_id references employees(id)
-- ==========================================================
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    employee_id INT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_employee_id (employee_id),
    INDEX idx_tasks_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table: notifications
-- Purpose: In-app notification center for task events and due date alerts
-- ==========================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type ENUM('TASK_ASSIGNED', 'STATUS_UPDATED', 'DUE_SOON', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    task_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX idx_notifications_user_unread (user_id, is_read),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Seed Data: Demo Users, Employees, and Tasks
-- Default Admin credentials:
--   Email: admin@portal.com (or username: admin)
--   Password: Admin@123
-- Password hash generated with Werkzeug generate_password_hash('Admin@123')
-- ==========================================================

INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@portal.com', 'scrypt:32768:8:1$uH35NfZW6FzS1RkL$e3fbf4ddcc49603cf3d2cbe7d057a6e112d7c0f133bc4e5da3c22ad65e6e16694389083fa3b455fa1103f6f3630f9a2ea9cbbd50b91e70d4c153716a5b6f38d3', 'admin'),
('developer', 'developer@portal.com', 'scrypt:32768:8:1$uH35NfZW6FzS1RkL$e3fbf4ddcc49603cf3d2cbe7d057a6e112d7c0f133bc4e5da3c22ad65e6e16694389083fa3b455fa1103f6f3630f9a2ea9cbbd50b91e70d4c153716a5b6f38d3', 'user');

INSERT INTO employees (name, email, department, role) VALUES
('Sarah Jenkins', 'sarah.jenkins@company.com', 'Engineering', 'Senior Full-Stack Engineer'),
('David Chen', 'david.chen@company.com', 'Engineering', 'Backend Developer'),
('Elena Rostova', 'elena.rostova@company.com', 'Product', 'Product Manager'),
('Marcus Brody', 'marcus.brody@company.com', 'Design', 'UI/UX Designer'),
('Priya Patel', 'priya.patel@company.com', 'Quality Assurance', 'QA Automation Engineer');

INSERT INTO tasks (title, description, employee_id, priority, status, due_date) VALUES
('Build Authentication Service', 'Implement JWT token generation, password hashing, and user authentication API endpoints.', 1, 'High', 'Completed', DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY)),
('Design Responsive Dashboard UI', 'Create responsive stat cards, navigation sidebar, and task progress indicators in Angular.', 4, 'High', 'In Progress', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)),
('Implement MySQL Schema & Migrations', 'Define relational tables for users, employees, and tasks with foreign keys and indexes.', 2, 'Medium', 'Completed', DATE_ADD(CURRENT_DATE, INTERVAL -4 DAY)),
('Automate E2E Test Suite', 'Write automated tests for task creation, employee CRUD, and status filtering workflows.', 5, 'Medium', 'Pending', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)),
('Draft Product Roadmap Q3', 'Finalize MVP feature list, gather feedback from stakeholders, and prioritize backlog.', 3, 'Low', 'In Progress', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)),
('Setup CORS and Security Headers', 'Configure CORS origins, rate limits, and sanitize user inputs across REST endpoints.', 2, 'Medium', 'Pending', DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY));
