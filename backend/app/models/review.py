from datetime import datetime
from app import db

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # От 1 до 5 звезди
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_approved = db.Column(db.Boolean, default=False)  # За модерация на отзивите

    def to_dict(self):
        return {
            'id': self.id,
            'client_name': self.client_name,
            'rating': self.rating,
            'text': self.text,
            'created_at': self.created_at.isoformat(),
            'is_approved': self.is_approved
        } 