from functools import wraps
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import check_password_hash, generate_password_hash
from ..models import User
from .. import db

auth_bp = Blueprint('auth', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Изрично проверяваме JWT токена тук
            verify_jwt_in_request()
            
            current_user_id = get_jwt_identity()
            print(f"Admin check for user ID: {current_user_id}")
            
            if not current_user_id:
                return jsonify({'error': 'Missing or invalid JWT token'}), 401
            
            # Опитваме се да намерим потребителя, като първо преобразуваме ID-то в int, ако е string
            try:
                if isinstance(current_user_id, str) and current_user_id.isdigit():
                    user_id = int(current_user_id)
                else:
                    user_id = current_user_id
                
                user = User.query.get(user_id)
            except Exception as e:
                print(f"Error converting user ID: {str(e)}")
                user = User.query.get(current_user_id)
                
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            if user.username != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
            
            print(f"Admin privileges confirmed for user: {user.username}")
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in admin_required: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
            
    return decorated_function

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create the token with the user's ID as string to avoid "Subject must be a string" error
    access_token = create_access_token(identity=str(user.id))
    
    # Return both the token and user info
    return jsonify({
        'access_token': access_token,
        'is_admin': user.username == 'admin',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me/', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authentication failed'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict(),
            'is_admin': user.username == 'admin'
        }), 200
    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 401

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    data = request.get_json()
    
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not check_password_hash(user.password_hash, data['old_password']):
        return jsonify({'error': 'Invalid old password'}), 401
    
    user.password_hash = generate_password_hash(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200 