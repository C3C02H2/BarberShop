from app import create_app, db
from app.models import Service, BusinessHours, Appointment
from datetime import time
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Add columns to appointments table if they don't exist
    try:
        # Add all missing columns to appointments table
        db.session.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'"))
        db.session.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price FLOAT DEFAULT 0.0"))
        db.session.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS barber_notes TEXT DEFAULT NULL"))
        db.session.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_rating INTEGER DEFAULT NULL"))
        db.session.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_feedback TEXT DEFAULT NULL"))
        db.session.commit()
        print("Added missing columns to appointments table")
    except Exception as e:
        print(f"Error adding columns to appointments table: {e}")
        db.session.rollback()
    
    # Add price column to services table if it doesn't exist
    try:
        db.session.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS price FLOAT DEFAULT 0.0"))
        db.session.commit()
        print("Added price column to services table")
    except Exception as e:
        print(f"Error adding price column: {e}")
        db.session.rollback()
    
    # Update or create services
    try:
        # Get existing services
        service1 = Service.query.filter_by(id=1).first()
        service2 = Service.query.filter_by(id=2).first()
        
        # Update service 1 if exists, otherwise create
        if service1:
            service1.name = "Коса (30 мин)"
            service1.description = "Професионално подстригване с ножица и машинка, включващо измиване и стайлинг."
            service1.duration = 30
            service1.price = 25.0
            service1.image_path = "/assets/haircut.jpg"
            print("Updated service 1")
        else:
            service1 = Service(
                id=1,
                name="Коса (30 мин)",
                description="Професионално подстригване с ножица и машинка, включващо измиване и стайлинг.",
                duration=30,
                price=25.0,
                image_path="/assets/haircut.jpg"
            )
            db.session.add(service1)
            print("Created service 1")
            
        # Update service 2 if exists, otherwise create
        if service2:
            service2.name = "Коса и брада (60 мин)"
            service2.description = "Комплексна услуга, включваща подстригване на коса и оформяне на брада."
            service2.duration = 60
            service2.price = 40.0
            service2.image_path = "/assets/beard-trim.jpg"
            print("Updated service 2")
        else:
            service2 = Service(
                id=2,
                name="Коса и брада (60 мин)",
                description="Комплексна услуга, включваща подстригване на коса и оформяне на брада.",
                duration=60,
                price=40.0,
                image_path = "/assets/beard-trim.jpg"
            )
            db.session.add(service2)
            print("Created service 2")
        
        # Delete all other services (except ID 1 and 2)
        other_services = Service.query.filter(~Service.id.in_([1, 2])).all()
        for service in other_services:
            db.session.delete(service)
            print(f"Deleted service {service.id}: {service.name}")
            
        db.session.commit()
        print("Services updated successfully")
    except Exception as e:
        print(f"Error updating services: {e}")
        db.session.rollback()
    
    # Set business hours to 9:00-20:00
    try:
        BusinessHours.query.delete()
        
        for day in range(7):  # 0=Monday to 6=Sunday
            db.session.add(BusinessHours(
                day_of_week=day,
                is_open=(day < 5),  # Open Monday-Friday
                open_time=time(9, 0),
                close_time=time(20, 0)
            ))
        
        db.session.commit()
        print("Set business hours to 9:00-20:00")
    except Exception as e:
        print(f"Error setting business hours: {e}")
        db.session.rollback()

print("Database fix completed") 