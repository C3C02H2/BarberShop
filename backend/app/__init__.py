import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

from .config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static')
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Improve JWT error handling
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            'error': 'Invalid token',
            'message': error_string
        }), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'message': 'Please log in again'
        }), 401
    
    # Log all requests for debugging
    @app.before_request
    def log_request_info():
        app.logger.debug('Headers: %s', request.headers)
        app.logger.debug('Body: %s', request.get_data())
    
    # Configure CORS more permissively
    CORS(app, 
         resources={r"/*": {
             "origins": ["http://localhost:3000", "http://192.168.0.131:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 600  # Cache preflight requests for 10 minutes
         }})
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.services import services_bp
    from .routes.appointments import appointments_bp
    from .routes.gallery import gallery_bp
    from .routes.reviews import reviews_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(gallery_bp, url_prefix='/api/gallery')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        from .models import User
        
        # Create admin user if not exists
        try:
            if not User.query.filter_by(username='admin').first():
                from werkzeug.security import generate_password_hash
                admin = User(
                    username='admin',
                    password_hash=generate_password_hash('admin')
                )
                db.session.add(admin)
                db.session.commit()
                print("Admin user created during initialization.")
        except Exception as e:
            print(f"Error creating admin user: {str(e)}")
            db.session.rollback()
    
    @app.route('/')
    def index():
        return {'message': 'API is running'}
    
    return app 