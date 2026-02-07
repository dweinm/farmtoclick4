import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production-please-use-a-real-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///farmtoclick.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MongoDB Configuration
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://dwein:dwein@cluster0.1h3ahm6.mongodb.net/farmtoclick'
    # WTF Forms CSRF Protection - Temporarily disabled for testing
    WTF_CSRF_ENABLED = False
    WTF_CSRF_TIME_LIMIT = None
    
    # For MongoDB Atlas (Cloud) - RECOMMENDED FOR APK
    # Set this environment variable:
    # export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/farmtoclick?retryWrites=true&w=majority"
    
    # For Local MongoDB Development
    # Make sure MongoDB is running locally:
    # MONGODB_URI = "mongodb://localhost:27017/farmtoclick"
    
    # For Production with Authentication
    # MONGODB_URI = "mongodb://username:password@host:port/database"

    # Email (SMTP) Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or 'farmtoclick@gmail.com'
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or 'xywk efxm xxqq sini'
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'FarmtoClick <farmtoclick@gmail.com>'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://dwein:dwein@cluster0.1h3ahm6.mongodb.net/farmtoclick'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # Use environment variables for production
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://dwein:dwein@cluster0.1h3ahm6.mongodb.net/farmtoclick'
    SECRET_KEY = os.environ.get('SECRET_KEY')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://dwein:dwein@cluster0.1h3ahm6.mongodb.net/farmtoclick'

    # Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
