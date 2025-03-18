from app import create_app, db
from app.models import BusinessHours
from datetime import time

def seed_business_hours():
    """Add default business hours for each day of the week"""
    app = create_app()
    
    with app.app_context():
        # Check if business hours already exist
        if BusinessHours.query.count() > 0:
            print("Business hours already exist in the database. Deleting old data...")
            BusinessHours.query.delete()
            db.session.commit()
        
        # Create business hours for each day of the week
        # Day format: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
        business_hours = [
            # Monday
            {
                'day_of_week': 0,
                'is_open': True,
                'open_time': time(9, 0),  # 9:00 AM
                'close_time': time(18, 0)  # 6:00 PM
            },
            # Tuesday
            {
                'day_of_week': 1,
                'is_open': True,
                'open_time': time(9, 0),  # 9:00 AM
                'close_time': time(18, 0)  # 6:00 PM
            },
            # Wednesday
            {
                'day_of_week': 2,
                'is_open': True,
                'open_time': time(9, 0),  # 9:00 AM
                'close_time': time(18, 0)  # 6:00 PM
            },
            # Thursday
            {
                'day_of_week': 3,
                'is_open': True,
                'open_time': time(9, 0),  # 9:00 AM
                'close_time': time(18, 0)  # 6:00 PM
            },
            # Friday
            {
                'day_of_week': 4,
                'is_open': True,
                'open_time': time(9, 0),  # 9:00 AM
                'close_time': time(18, 0)  # 6:00 PM
            },
            # Saturday
            {
                'day_of_week': 5,
                'is_open': True,
                'open_time': time(10, 0),  # 10:00 AM
                'close_time': time(16, 0)  # 4:00 PM
            },
            # Sunday
            {
                'day_of_week': 6,
                'is_open': False,
                'open_time': time(0, 0),  # Not used when closed
                'close_time': time(0, 0)  # Not used when closed
            }
        ]
        
        # Add business hours to database
        for hours_data in business_hours:
            hours = BusinessHours(
                day_of_week=hours_data['day_of_week'],
                is_open=hours_data['is_open'],
                open_time=hours_data['open_time'],
                close_time=hours_data['close_time']
            )
            db.session.add(hours)
        
        db.session.commit()
        print(f"Added business hours for 7 days of the week.")

if __name__ == '__main__':
    seed_business_hours() 