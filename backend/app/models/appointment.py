from datetime import datetime
from .. import db

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # New fields
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, confirmed, completed, cancelled
    price = db.Column(db.Float, nullable=True)
    barber_notes = db.Column(db.Text, nullable=True)
    client_rating = db.Column(db.Integer, nullable=True)  # 1-5 stars
    client_feedback = db.Column(db.Text, nullable=True)
    
    service = db.relationship('Service', backref='appointments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'service_name': self.service.name if self.service else None,
            'service_duration': self.service.duration if self.service else None,
            'name': self.name,
            'phone': self.phone,
            'message': self.message,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'price': float(self.price) if self.price is not None else None,
            'status': self.status,
            'barber_notes': self.barber_notes,
            'client_rating': self.client_rating,
            'client_feedback': self.client_feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 