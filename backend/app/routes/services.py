from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..models import Service, Appointment
from .. import db

services_bp = Blueprint('services', __name__)

@services_bp.route('/', methods=['GET', 'OPTIONS'])
@services_bp.route('', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_services():
    if request.method == 'OPTIONS':
        return '', 200
        
    services = Service.query.all()
    return jsonify({'services': [service.to_dict() for service in services]}), 200

@services_bp.route('/<int:service_id>/', methods=['GET', 'OPTIONS'])
@services_bp.route('/<int:service_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_service(service_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    service = Service.query.get(service_id)
    
    if not service:
        return jsonify({'message': 'Service not found'}), 404
    
    return jsonify({'service': service.to_dict()}), 200

@services_bp.route('/', methods=['POST', 'OPTIONS'])
@services_bp.route('', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_service():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('duration') or not data.get('price'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    service = Service(
        name=data['name'],
        description=data.get('description', ''),
        duration=int(data['duration']),
        price=float(data['price'])
    )
    
    db.session.add(service)
    db.session.commit()
    
    return jsonify({'service': service.to_dict()}), 201

@services_bp.route('/<int:service_id>/', methods=['PUT', 'OPTIONS'])
@services_bp.route('/<int:service_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_service(service_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    service = Service.query.get(service_id)
    
    if not service:
        return jsonify({'message': 'Service not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        service.name = data['name']
    
    if 'description' in data:
        service.description = data['description']
    
    if 'duration' in data:
        service.duration = int(data['duration'])
    
    if 'price' in data:
        service.price = float(data['price'])
    
    db.session.commit()
    
    return jsonify({'service': service.to_dict()}), 200

@services_bp.route('/<int:service_id>/', methods=['DELETE', 'OPTIONS'])
@services_bp.route('/<int:service_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_service(service_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    service = Service.query.get(service_id)
    
    if not service:
        return jsonify({'message': 'Service not found'}), 404
    
    # Check for existing appointments
    existing_appointments = Appointment.query.filter_by(service_id=service_id).all()
    if existing_appointments:
        return jsonify({
            'message': 'Не може да изтриете тази услуга, защото има резервации, свързани с нея.',
            'appointments_count': len(existing_appointments)
        }), 400
    
    try:
        db.session.delete(service)
        db.session.commit()
        return jsonify({'message': 'Услугата е изтрита успешно'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Грешка при изтриване на услугата'}), 500 