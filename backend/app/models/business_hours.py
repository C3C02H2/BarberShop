from .. import db

class BusinessHours(db.Model):
    __tablename__ = 'business_hours'
    
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    is_open = db.Column(db.Boolean, default=True)
    open_time = db.Column(db.Time, nullable=False)
    close_time = db.Column(db.Time, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'is_open': self.is_open,
            'open_time': self.open_time.isoformat() if self.open_time else None,
            'close_time': self.close_time.isoformat() if self.close_time else None
        } 