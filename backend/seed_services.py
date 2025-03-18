from app import create_app
from app.models import Service
from app import db

def seed_services():
    """Add seed data for services"""
    app = create_app()
    
    with app.app_context():
        # Check if we already have services
        if Service.query.count() > 0:
            print("Services already exist in the database. Skipping seed.")
            return
        
        # Create sample services
        services = [
            {
                'name': 'Подстригване',
                'description': 'Професионално подстригване със стил по избор.',
                'duration': 30
            },
            {
                'name': 'Боядисване',
                'description': 'Пълно боядисване с висококачествени продукти.',
                'duration': 60
            },
            {
                'name': 'Маникюр',
                'description': 'Професионален маникюр с дълготрайно покритие.',
                'duration': 45
            },
            {
                'name': 'Масаж',
                'description': 'Релаксиращ масаж с етерични масла.',
                'duration': 60
            }
        ]
        
        # Add services to database
        for service_data in services:
            service = Service(
                name=service_data['name'],
                description=service_data['description'],
                duration=service_data['duration']
            )
            db.session.add(service)
        
        db.session.commit()
        print(f"Added {len(services)} services to the database.")

if __name__ == '__main__':
    seed_services() 