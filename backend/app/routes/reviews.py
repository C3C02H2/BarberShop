from flask import Blueprint, request, jsonify
from app import db
from app.models.review import Review
from app.routes.auth import admin_required
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/', methods=['POST'])
def create_review():
    data = request.get_json()
    
    if not all(key in data for key in ['client_name', 'rating', 'text']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not isinstance(data['rating'], int) or not 1 <= data['rating'] <= 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    review = Review(
        client_name=data['client_name'],
        rating=data['rating'],
        text=data['text']
    )
    
    db.session.add(review)
    db.session.commit()
    
    return jsonify({'message': 'Review submitted successfully', 'review': review.to_dict()}), 201

@reviews_bp.route('/', methods=['GET'])
def get_reviews():
    # За публичната страница показваме само одобрените отзиви
    reviews = Review.query.filter_by(is_approved=True).order_by(Review.created_at.desc()).all()
    return jsonify({'reviews': [review.to_dict() for review in reviews]})

@reviews_bp.route('/admin', methods=['GET'])
@admin_required
def get_admin_reviews():
    try:
        # За админ панела показваме всички отзиви
        reviews = Review.query.order_by(Review.created_at.desc()).all()
        return jsonify({'reviews': [review.to_dict() for review in reviews]})
    except Exception as e:
        print(f"Error in get_admin_reviews: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/admin/<int:review_id>/approve', methods=['POST'])
@admin_required
def approve_review(review_id):
    try:
        review = Review.query.get_or_404(review_id)
        review.is_approved = True
        db.session.commit()
        return jsonify({'message': 'Review approved successfully', 'review': review.to_dict()})
    except Exception as e:
        print(f"Error in approve_review: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/admin/<int:review_id>', methods=['DELETE'])
@admin_required
def delete_review(review_id):
    try:
        review = Review.query.get_or_404(review_id)
        db.session.delete(review)
        db.session.commit()
        return jsonify({'message': 'Review deleted successfully'})
    except Exception as e:
        print(f"Error in delete_review: {str(e)}")
        return jsonify({'error': str(e)}), 500 