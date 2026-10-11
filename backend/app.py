"""
CollabX Research & Innovation Portal — Backend API & Authentication Service
Flask application with secure session handling, Werkzeug password hashing,
and parameterized database queries for MySQL / MariaDB (CSE 222 DBMS).
"""

import os
import re
import uuid
import datetime
from functools import wraps
from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

# Optional CORS support
try:
    from flask_cors import CORS
    has_cors = True
except ImportError:
    has_cors = False

app = Flask(__name__)

# Security & Session Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'collabx_production_secret_key_2026_cse222')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=7)

if has_cors:
    CORS(app, supports_credentials=True)

# -----------------------------------------------------------------------------
# Database Connection Manager (MySQL with SQLite fallback for test execution)
# -----------------------------------------------------------------------------
DB_ENGINE = os.environ.get('DB_ENGINE', 'sqlite')  # 'mysql' or 'sqlite'

def get_db_connection():
    if DB_ENGINE == 'mysql':
        import pymysql
        return pymysql.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', ''),
            database=os.environ.get('MYSQL_DB', 'collabx'),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
    else:
        import sqlite3
        conn = sqlite3.connect('collabx_backend.db')
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create users table if not exists matching schema.sql
    if DB_ENGINE == 'sqlite':
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                university_id TEXT UNIQUE,
                role TEXT NOT NULL DEFAULT 'student',
                status TEXT NOT NULL DEFAULT 'active',
                headline TEXT,
                institution TEXT DEFAULT 'Port City International University',
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Seed default accounts if empty
        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        row = cursor.fetchone()
        if (row['cnt'] if hasattr(row, '__getitem__') else row[0]) == 0:
            demo_hash = generate_password_hash('Password@123', method='pbkdf2:sha256')
            seed_accounts = [
                ('user-ash', 'Ash Ketchum', 'ash@collabx.test', demo_hash, '2022-1-60-001', 'student', 'active'),
                ('user-fahim', 'Dr. Fahim Rahman', 'fahim@collabx.test', demo_hash, 'FAC-CSE-001', 'supervisor', 'active'),
                ('user-brock', 'Brock Harrison', 'brock@collabx.test', demo_hash, '2021-3-60-045', 'researcher', 'active'),
                ('user-admin', 'CollabX Administrator', 'admin@collabx.test', demo_hash, 'ADM-001', 'admin', 'active'),
                ('user-gary', 'Gary Oak', 'gary@collabx.test', demo_hash, '2022-1-60-003', 'student', 'inactive'),
            ]
            for acc in seed_accounts:
                cursor.execute(
                    'INSERT INTO users (id, name, email, password_hash, university_id, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    acc
                )
            conn.commit()
    conn.close()

# -----------------------------------------------------------------------------
# Route Guard Decorators
# -----------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'error': 'Authentication required.'}), 401
            user_role = session.get('role', 'student')
            if user_role not in allowed_roles:
                return jsonify({'success': False, 'error': f'Access restricted. Requires {allowed_roles} privileges.'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# -----------------------------------------------------------------------------
# Input Validation Utilities
# -----------------------------------------------------------------------------
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, (email or '').strip()))

def validate_password_strength(password):
    if not password or len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[a-zA-Z]', password):
        return False, 'Password must contain at least one letter.'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one number.'
    return True, None

def get_dashboard_route(role):
    if role == 'admin':
        return '/admin'
    elif role in ('supervisor', 'researcher'):
        return '/researcher'
    return '/dashboard'

# -----------------------------------------------------------------------------
# 1. STRICT REGISTRATION ROUTE
# -----------------------------------------------------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''
    role = data.get('role') or 'student'
    university_id = (data.get('university_id') or '').strip()

    # 1. Validate required fields
    if not name:
        return jsonify({'success': False, 'error': 'Full name is required.'}), 400
    if not email:
        return jsonify({'success': False, 'error': 'Academic email is required.'}), 400
    if not password:
        return jsonify({'success': False, 'error': 'Password is required.'}), 400

    # 2. Validate email format
    if not is_valid_email(email):
        return jsonify({'success': False, 'error': 'Please provide a valid academic email address.'}), 400

    # 3. Validate role
    if role not in ('student', 'researcher', 'supervisor', 'admin'):
        role = 'student'

    # 4. Validate password complexity
    pw_valid, pw_err = validate_password_strength(password)
    if not pw_valid:
        return jsonify({'success': False, 'error': pw_err}), 400

    # 5. Validate password confirmation
    if password != confirm_password:
        return jsonify({'success': False, 'error': 'Passwords do not match.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 6. Check whether email already exists (parameterized query)
        ph = '?' if DB_ENGINE == 'sqlite' else '%s'
        cursor.execute(f'SELECT id FROM users WHERE LOWER(email) = LOWER({ph})', (email,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'An account with this email address already exists. Please log in.'}), 409

        # 7. Check whether university ID already exists if provided
        if university_id:
            cursor.execute(f'SELECT id FROM users WHERE LOWER(university_id) = LOWER({ph})', (university_id,))
            if cursor.fetchone():
                return jsonify({'success': False, 'error': 'An account with this University ID already exists.'}), 409

        # 8. Hash password securely using Werkzeug PBKDF2:SHA256
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        user_id = f'user-{uuid.uuid4().hex[:12]}'

        # 9. Insert new user into MySQL / SQLite database using parameterized query
        cursor.execute(
            f'''
            INSERT INTO users (id, name, email, password_hash, university_id, role, status, institution)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            ''',
            (user_id, name, email, password_hash, university_id or None, role, 'active', 'Port City International University')
        )
        if DB_ENGINE == 'sqlite':
            conn.commit()

        # 10. STRICT FLOW: Do NOT create an authenticated session on registration.
        # Return success with status 201 so frontend redirects visitor to Login page.
        return jsonify({
            'success': True,
            'message': 'Account registered successfully! Please log in with your credentials.',
            'redirect': '/login'
        }), 201

    finally:
        conn.close()

# -----------------------------------------------------------------------------
# 2. STRICT LOGIN VALIDATION ROUTE
# -----------------------------------------------------------------------------
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    # 1. Validate empty inputs
    if not email or not password:
        return jsonify({'success': False, 'error': 'Please enter both email and password.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        ph = '?' if DB_ENGINE == 'sqlite' else '%s'
        # 2. Parameterized query lookup by email
        cursor.execute(
            f'SELECT id, name, email, password_hash, university_id, role, status FROM users WHERE LOWER(email) = LOWER({ph})',
            (email,)
        )
        user_row = cursor.fetchone()

        # 3. Reject if account does not exist (Generic error without leaking email existence)
        if not user_row:
            return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

        user = dict(user_row) if DB_ENGINE == 'sqlite' else user_row

        # 4. Verify submitted password against stored hash using Werkzeug
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

        # 5. Check account status
        if user.get('status') == 'inactive':
            return jsonify({'success': False, 'error': 'Your account is currently disabled or inactive. Please contact the administrator.'}), 403

        if user.get('status') == 'pending':
            return jsonify({'success': False, 'error': 'Your account registration is pending administrator approval.'}), 403

        # 6. Session Management: Clear previous session state to prevent session fixation
        session.clear()
        session.permanent = True
        session['user_id'] = user['id']
        session['role'] = user['role']
        session['email'] = user['email']
        session['authenticated_at'] = datetime.datetime.utcnow().isoformat()

        # 7. Safe user representation (omit password hash)
        safe_user = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'status': user['status'],
            'universityId': user.get('university_id')
        }

        # 8. Redirect user based on database role
        redirect_route = get_dashboard_route(user['role'])

        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'user': safe_user,
            'redirect': redirect_route
        }), 200

    finally:
        conn.close()

# -----------------------------------------------------------------------------
# 3. SESSION LOGOUT ROUTE
# -----------------------------------------------------------------------------
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logged out successfully.',
        'redirect': '/'
    }), 200

# -----------------------------------------------------------------------------
# 4. SESSION VERIFICATION ROUTE (/api/auth/session)
# -----------------------------------------------------------------------------
@app.route('/api/auth/session', methods=['GET'])
def get_current_session():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None}), 200

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        ph = '?' if DB_ENGINE == 'sqlite' else '%s'
        cursor.execute(
            f'SELECT id, name, email, university_id, role, status FROM users WHERE id = {ph}',
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            session.clear()
            return jsonify({'authenticated': False, 'user': None}), 200

        user = dict(row) if DB_ENGINE == 'sqlite' else row
        if user.get('status') != 'active':
            session.clear()
            return jsonify({'authenticated': False, 'user': None, 'error': 'Account inactive.'}), 403

        return jsonify({
            'authenticated': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'status': user['status'],
                'universityId': user.get('university_id')
            }
        }), 200

    finally:
        conn.close()

# -----------------------------------------------------------------------------
# Protected Route Sample (Dashboard Gate)
# -----------------------------------------------------------------------------
@app.route('/api/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    return jsonify({
        'success': True,
        'user_id': session['user_id'],
        'role': session['role'],
        'status': 'authorized'
    }), 200

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
