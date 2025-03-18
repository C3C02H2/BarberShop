from app import create_app, db
from sqlalchemy import text

def recreate_db():
    """Drop all tables and create them again"""
    app = create_app()
    
    with app.app_context():
        # Използваме директни SQL заявки за промяна на колоната
        connection = db.engine.connect()
        
        try:
            # Промяна на размера на password_hash колоната
            connection.execute(text("ALTER TABLE users ALTER COLUMN password_hash TYPE VARCHAR(256)"))
            connection.commit()
            print("Password hash column size increased to 256.")
        except Exception as e:
            print(f"Error altering table: {str(e)}")
            connection.rollback()
            
            # Опитваме се да премахнем всички таблици и да ги пресъздадем
            try:
                db.drop_all()
                print("All tables dropped.")
                db.create_all()
                print("All tables created.")
            except Exception as drop_error:
                print(f"Error recreating tables: {str(drop_error)}")
                return
        
        # Създаваме admin потребител
        try:
            from app.models import User
            from werkzeug.security import generate_password_hash
            
            # Проверяваме дали потребителят вече съществува
            admin = User.query.filter_by(username='admin').first()
            if admin:
                print("Admin user already exists.")
            else:
                admin = User(
                    username='admin',
                    password_hash=generate_password_hash('admin')
                )
                db.session.add(admin)
                db.session.commit()
                print("Admin user created.")
        except Exception as user_error:
            print(f"Error creating admin user: {str(user_error)}")
            db.session.rollback()

if __name__ == '__main__':
    recreate_db() 