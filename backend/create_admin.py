from app import create_app, db
from app.models import User

def create_admin_user():
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        
        if admin:
            print("Admin user already exists. Updating password...")
            admin.set_password('admin123')
        else:
            print("Creating new admin user...")
            admin = User(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Commit changes
        db.session.commit()
        print("Admin user is now available with username: 'admin' and password: 'admin123'")

if __name__ == '__main__':
    create_admin_user() 