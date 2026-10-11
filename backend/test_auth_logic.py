#!/usr/bin/env python3
"""
CollabX Security & Authentication Unit Test Suite
Standard library test runner validating registration, login, hashing,
session lifecycle, and role routing rules.
"""

import unittest
import sqlite3
import hashlib
import hmac
import os
import re
import uuid

# -----------------------------------------------------------------------------
# Standalone Cryptographic Hashing (RFC 2898 PBKDF2:SHA256 matching Werkzeug)
# -----------------------------------------------------------------------------
def pbkdf2_hash_password(password: str, salt: str = 'c011abx_s41t_2026', iterations: int = 10000) -> str:
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"

def verify_password_hash(password: str, stored_hash: str) -> bool:
    if not password or not stored_hash:
        return False
    parts = stored_hash.split('$')
    if len(parts) == 3 and parts[0].startswith('pbkdf2:sha256:'):
        iterations = int(parts[0].split(':')[2])
        salt = parts[1]
        expected_hex = parts[2]
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
        return hmac.compare_digest(key.hex(), expected_hex)
    if stored_hash.startswith('sha256$') and len(parts) == 3:
        salt = parts[1]
        expected_hex = parts[2]
        combined = f"{salt}:{password}".encode('utf-8')
        computed = hashlib.sha256(combined).hexdigest()
        return hmac.compare_digest(computed, expected_hex)
    return False

# -----------------------------------------------------------------------------
# CollabX Auth Logic Engine
# -----------------------------------------------------------------------------
class CollabXAuthEngine:
    def __init__(self, db_conn):
        self.conn = db_conn
        self.session = {}

    def is_valid_email(self, email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, (email or '').strip()))

    def validate_password_strength(self, password: str):
        if not password or len(password) < 8:
            return False, 'Password must be at least 8 characters long.'
        if not re.search(r'[a-zA-Z]', password):
            return False, 'Password must contain at least one letter.'
        if not re.search(r'[0-9]', password):
            return False, 'Password must contain at least one number.'
        return True, None

    def get_dashboard_route(self, role: str) -> str:
        if role == 'admin':
            return '/admin'
        elif role in ('supervisor', 'researcher'):
            return '/researcher'
        return '/dashboard'

    def register(self, name: str, email: str, password: str, confirm_password: str, role: str = 'student', university_id: str = None):
        name = (name or '').strip()
        email = (email or '').strip().lower()
        password = password or ''
        confirm_password = confirm_password or ''

        # 1. Required fields
        if not name or not email or not password:
            return {'success': False, 'error': 'All required fields must be filled.'}, 400

        # 2. Email format validation
        if not self.is_valid_email(email):
            return {'success': False, 'error': 'Invalid academic email address format.'}, 400

        # 3. Password confirmation
        if password != confirm_password:
            return {'success': False, 'error': 'Passwords do not match.'}, 400

        # 4. Password complexity
        valid, msg = self.validate_password_strength(password)
        if not valid:
            return {'success': False, 'error': msg}, 400

        cursor = self.conn.cursor()

        # 5. Duplicate email check (parameterized)
        cursor.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', (email,))
        if cursor.fetchone():
            return {'success': False, 'error': 'An account with this email address already exists. Please log in.'}, 409

        # 6. Duplicate university ID check
        if university_id:
            cursor.execute('SELECT id FROM users WHERE LOWER(university_id) = LOWER(?)', (university_id.strip(),))
            if cursor.fetchone():
                return {'success': False, 'error': 'An account with this University ID already exists.'}, 409

        # 7. Hash password securely
        hashed = pbkdf2_hash_password(password)
        user_id = f'user-{uuid.uuid4().hex[:12]}'

        # 8. Save user in database
        cursor.execute(
            'INSERT INTO users (id, name, email, password_hash, university_id, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (user_id, name, email, hashed, university_id, role, 'active')
        )
        self.conn.commit()

        # 9. Return success without creating an authenticated session
        return {
            'success': True,
            'message': 'Registration successful! You can now log in with your credentials.',
            'redirect': '/login'
        }, 201

    def login(self, email: str, password: str):
        email = (email or '').strip().lower()
        password = password or ''

        # 1. Empty fields check
        if not email or not password:
            return {'success': False, 'error': 'Please enter both email and password.'}, 400

        cursor = self.conn.cursor()
        # 2. Parameterized SQL query
        cursor.execute(
            'SELECT id, name, email, password_hash, university_id, role, status FROM users WHERE LOWER(email) = LOWER(?)',
            (email,)
        )
        row = cursor.fetchone()

        # 3. Account exists check (Generic error)
        if not row:
            return {'success': False, 'error': 'Invalid email or password.'}, 401

        user_id, name, user_email, pwhash, u_id, role, status = row

        # 4. Verify password hash
        if not verify_password_hash(password, pwhash):
            return {'success': False, 'error': 'Invalid email or password.'}, 401

        # 5. Check inactive status
        if status == 'inactive':
            return {'success': False, 'error': 'Your account is currently disabled or inactive. Please contact the administrator.'}, 403

        # 6. Create authenticated session
        self.session.clear()
        self.session['user_id'] = user_id
        self.session['role'] = role
        self.session['email'] = user_email

        return {
            'success': True,
            'message': 'Login successful.',
            'user': {'id': user_id, 'name': name, 'email': user_email, 'role': role, 'status': status},
            'redirect': self.get_dashboard_route(role)
        }, 200

    def logout(self):
        self.session.clear()
        return {'success': True, 'message': 'Logged out successfully.'}, 200

# -----------------------------------------------------------------------------
# Unit Test Cases
# -----------------------------------------------------------------------------
class TestCollabXAuthentication(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(':memory:')
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                university_id TEXT UNIQUE,
                role TEXT NOT NULL DEFAULT 'student',
                status TEXT NOT NULL DEFAULT 'active'
            )
        ''')
        default_hash = pbkdf2_hash_password('Password@123')
        cursor.execute('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)',
                       ('user-ash', 'Ash Ketchum', 'ash@collabx.test', default_hash, '2022-1-60-001', 'student', 'active'))
        cursor.execute('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)',
                       ('user-fahim', 'Dr. Fahim Rahman', 'fahim@collabx.test', default_hash, 'FAC-CSE-001', 'supervisor', 'active'))
        cursor.execute('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)',
                       ('user-admin', 'CollabX Administrator', 'admin@collabx.test', default_hash, 'ADM-001', 'admin', 'active'))
        cursor.execute('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)',
                       ('user-gary', 'Gary Oak', 'gary@collabx.test', default_hash, '2022-1-60-003', 'student', 'inactive'))
        self.conn.commit()
        self.engine = CollabXAuthEngine(self.conn)

    def tearDown(self):
        self.conn.close()

    def test_unregistered_email_login_fails(self):
        """Unregistered email + any password = LOGIN FAILURE (Generic error)"""
        res, code = self.engine.login('notreal@unknown.com', 'Password@123')
        self.assertEqual(code, 401)
        self.assertFalse(res['success'])
        self.assertEqual(res['error'], 'Invalid email or password.')
        self.assertNotIn('user_id', self.engine.session)

    def test_registered_email_incorrect_password_fails(self):
        """Registered email + incorrect password = LOGIN FAILURE (Generic error)"""
        res, code = self.engine.login('ash@collabx.test', 'WrongPassword123!')
        self.assertEqual(code, 401)
        self.assertFalse(res['success'])
        self.assertEqual(res['error'], 'Invalid email or password.')
        self.assertNotIn('user_id', self.engine.session)

    def test_empty_email_or_password_fails(self):
        """Empty email or password = VALIDATION ERROR"""
        res, code = self.engine.login('', 'Password@123')
        self.assertEqual(code, 400)
        self.assertIn('both email and password', res['error'])

        res, code = self.engine.login('ash@collabx.test', '')
        self.assertEqual(code, 400)
        self.assertIn('both email and password', res['error'])

    def test_disabled_account_login_fails(self):
        """Disabled account + correct password = LOGIN FAILURE"""
        res, code = self.engine.login('gary@collabx.test', 'Password@123')
        self.assertEqual(code, 403)
        self.assertFalse(res['success'])
        self.assertIn('disabled or inactive', res['error'])
        self.assertNotIn('user_id', self.engine.session)

    def test_registered_email_correct_password_succeeds(self):
        """Registered email + correct password = LOGIN SUCCESS"""
        res, code = self.engine.login('ash@collabx.test', 'Password@123')
        self.assertEqual(code, 200)
        self.assertTrue(res['success'])
        self.assertEqual(res['redirect'], '/dashboard')
        self.assertEqual(self.engine.session.get('user_id'), 'user-ash')

    def test_supervisor_and_admin_role_redirects(self):
        """Role redirects match database roles: supervisor -> /researcher, admin -> /admin"""
        res, code = self.engine.login('fahim@collabx.test', 'Password@123')
        self.assertEqual(code, 200)
        self.assertEqual(res['redirect'], '/researcher')

        res, code = self.engine.login('admin@collabx.test', 'Password@123')
        self.assertEqual(code, 200)
        self.assertEqual(res['redirect'], '/admin')

    def test_registration_validation_and_duplicate_rejection(self):
        """Registration validates fields, password confirmation, and rejects duplicates"""
        # Invalid email format
        res, code = self.engine.register('Test User', 'notanemail', 'Password@123', 'Password@123')
        self.assertEqual(code, 400)

        # Password mismatch
        res, code = self.engine.register('Test User', 'new@collabx.test', 'Password@123', 'DifferentPassword@123')
        self.assertEqual(code, 400)
        self.assertEqual(res['error'], 'Passwords do not match.')

        # Weak password
        res, code = self.engine.register('Test User', 'new@collabx.test', 'short', 'short')
        self.assertEqual(code, 400)

        # Duplicate email
        res, code = self.engine.register('Test User', 'ash@collabx.test', 'Password@123', 'Password@123')
        self.assertEqual(code, 409)

        # Duplicate university ID
        res, code = self.engine.register('Test User', 'new@collabx.test', 'Password@123', 'Password@123', university_id='2022-1-60-001')
        self.assertEqual(code, 409)

    def test_registration_success_does_not_auto_login(self):
        """Registration saves user, does NOT create session, and redirects to Login"""
        res, code = self.engine.register(
            'New Scholar', 'scholar@portcity.edu.bd', 'SecurePass2026', 'SecurePass2026',
            role='student', university_id='2022-1-60-999'
        )
        self.assertEqual(code, 201)
        self.assertTrue(res['success'])
        self.assertEqual(res['redirect'], '/login')
        # Session must remain empty!
        self.assertNotIn('user_id', self.engine.session)

        # The newly registered user can now log in
        login_res, login_code = self.engine.login('scholar@portcity.edu.bd', 'SecurePass2026')
        self.assertEqual(login_code, 200)
        self.assertTrue(login_res['success'])
        self.assertEqual(self.engine.session['email'], 'scholar@portcity.edu.bd')

    def test_logout_destroys_session(self):
        """Logout clears the authenticated session"""
        self.engine.login('ash@collabx.test', 'Password@123')
        self.assertEqual(self.engine.session.get('user_id'), 'user-ash')

        self.engine.logout()
        self.assertNotIn('user_id', self.engine.session)


if __name__ == '__main__':
    unittest.main(verbosity=2)
