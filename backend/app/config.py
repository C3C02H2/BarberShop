import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://postgres:1@192.168.0.220:5433/postgres'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or '5a7f699e3c492f5a0d5e669f3013b9650d114c61e7b2e62f4ed4c9c15c3a0620'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Extended for easier development
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ERROR_MESSAGE_KEY = 'error'
    JWT_BLACKLIST_ENABLED = False
    
    # Added to increase token security
    JWT_IDENTITY_CLAIM = 'sub'
    JWT_DECODE_ALGORITHMS = ['HS256']
    
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload 