from datetime import datetime, time, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import and_, or_, desc
from ..models import Appointment, Service, BusinessHours, BlockedDate
from .. import db

appointments_bp = Blueprint('appointments', __name__)

def is_time_available(date, start_time, end_time):
    # Check if date is blocked
    blocked = BlockedDate.query.filter_by(date=date).first()
    if blocked:
        return False
    
    # Check if within business hours
    day_of_week = date.weekday()  # 0=Monday, 6=Sunday
    business_hours = BusinessHours.query.filter_by(day_of_week=day_of_week).first()
    
    if not business_hours or not business_hours.is_open:
        return False
    
    if start_time < business_hours.open_time or end_time > business_hours.close_time:
        return False
    
    # Check for overlapping appointments
    overlapping = Appointment.query.filter(
        Appointment.date == date,
        or_(
            and_(Appointment.start_time <= start_time, Appointment.end_time > start_time),
            and_(Appointment.start_time < end_time, Appointment.end_time >= end_time),
            and_(Appointment.start_time >= start_time, Appointment.end_time <= end_time)
        )
    ).first()
    
    return overlapping is None

@appointments_bp.route('/', methods=['GET'])
def get_appointments():
    try:
        # Опционално филтриране по дата
        date_filter = request.args.get('date')
        
        query = Appointment.query
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                print(f"Филтриране на резервации за дата: {filter_date}")
                query = query.filter(Appointment.date == filter_date)
            except ValueError:
                print(f"Невалиден формат на дата: {date_filter}")
        
        # Сортиране първо по дата, след това по начален час
        appointments = query.order_by(Appointment.date, Appointment.start_time).all()
        print(f"Намерени {len(appointments)} резервации")
        
        # Добавяме имената на услугите към резултата
        result = []
        for appointment in appointments:
            appointment_dict = appointment.to_dict()
            
            # Добавяме информация за услугата
            if appointment.service:
                appointment_dict['service_name'] = appointment.service.name
                appointment_dict['service_duration'] = appointment.service.duration
            
            result.append(appointment_dict)
        
        return jsonify({'appointments': result}), 200
    except Exception as e:
        error_msg = f"Грешка при извличане на резервации: {str(e)}"
        print(error_msg)
        return jsonify({'message': error_msg}), 500

@appointments_bp.route('/<int:appointment_id>/', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    return jsonify({'appointment': appointment.to_dict()}), 200

@appointments_bp.route('/', methods=['POST'])
def create_appointment():
    data = request.get_json()
    
    if not data or not all(k in data for k in ('service_id', 'name', 'phone', 'date', 'start_time')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        service = Service.query.get(data['service_id'])
        if not service:
            return jsonify({'message': 'Service not found'}), 404
        
        date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        
        # Calculate end time based on service duration
        start_datetime = datetime.combine(date, start_time)
        end_datetime = start_datetime + timedelta(minutes=service.duration)
        end_time = end_datetime.time()
        
        if not is_time_available(date, start_time, end_time):
            return jsonify({'message': 'The selected time is not available'}), 400
        
        appointment = Appointment(
            service_id=service.id,
            name=data['name'],
            phone=data['phone'],
            message=data.get('message', ''),
            date=date,
            start_time=start_time,
            end_time=end_time,
            price=service.price,
            status='pending'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({'appointment': appointment.to_dict()}), 201
    
    except ValueError:
        return jsonify({'message': 'Invalid date or time format'}), 400

@appointments_bp.route('/<int:appointment_id>/', methods=['PUT'])
# Временно премахваме @jwt_required() за тестване
def update_appointment(appointment_id):
    try:
        print(f"Опит за актуализиране на резервация с ID: {appointment_id}")
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            print(f"Резервация с ID {appointment_id} не е намерена")
            return jsonify({'message': 'Appointment not found'}), 404
        
        data = request.get_json()
        print(f"Получени данни: {data}")
        
        try:
            # Запазване на оригиналните стойности за проверка на промените
            original_date = appointment.date
            original_start_time = appointment.start_time
            original_service_id = appointment.service_id
            
            # Обработка на промяна на услугата
            if 'service_id' in data and data['service_id']:
                service_id = int(data['service_id'])
                service = Service.query.get(service_id)
                if not service:
                    print(f"Услуга с ID {service_id} не е намерена")
                    return jsonify({'message': 'Service not found'}), 404
                appointment.service_id = service_id
            
            # Обработка на другите полета
            if 'name' in data:
                appointment.name = data['name']
                
            if 'phone' in data:
                appointment.phone = data['phone']
                
            if 'message' in data:
                appointment.message = data['message']
                
            if 'date' in data:
                appointment.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            
            if 'start_time' in data:
                appointment.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            
            if 'status' in data:
                appointment.status = data['status']
            
            if 'barber_notes' in data:
                appointment.barber_notes = data['barber_notes']
            
            # Преизчисляване на крайния час при промяна на услугата, датата или началния час
            service_changed = 'service_id' in data and int(data['service_id']) != original_service_id
            date_changed = 'date' in data and appointment.date != original_date
            time_changed = 'start_time' in data and appointment.start_time != original_start_time
            
            if service_changed or date_changed or time_changed:
                start_datetime = datetime.combine(appointment.date, appointment.start_time)
                end_datetime = start_datetime + timedelta(minutes=appointment.service.duration)
                appointment.end_time = end_datetime.time()
                
                # Проверка за достъпност само ако има промяна в датата, часа или услугата
                print(f"Проверка за достъпност на час: {appointment.date} {appointment.start_time} - {appointment.end_time}")
                
                # При проверката за достъпност не трябва да се взема предвид текущата резервация
                # Извличаме всички резервации за деня, освен текущата
                overlapping = Appointment.query.filter(
                    Appointment.date == appointment.date,
                    Appointment.id != appointment.id,
                    or_(
                        and_(Appointment.start_time <= appointment.start_time, Appointment.end_time > appointment.start_time),
                        and_(Appointment.start_time < appointment.end_time, Appointment.end_time >= appointment.end_time),
                        and_(Appointment.start_time >= appointment.start_time, Appointment.end_time <= appointment.end_time)
                    )
                ).first()
                
                if overlapping:
                    print(f"Часът не е достъпен - има припокриване с резервация ID: {overlapping.id}")
                    return jsonify({'message': 'The selected time is not available'}), 400
                
                # Проверка за работно време
                day_of_week = appointment.date.weekday()
                business_hours = BusinessHours.query.filter_by(day_of_week=day_of_week).first()
                
                if not business_hours or not business_hours.is_open:
                    print(f"Денят не е работен: {appointment.date}")
                    return jsonify({'message': 'The selected day is not a business day'}), 400
                
                if appointment.start_time < business_hours.open_time or appointment.end_time > business_hours.close_time:
                    print(f"Часът е извън работното време: {appointment.start_time} - {appointment.end_time}")
                    return jsonify({'message': 'The selected time is outside business hours'}), 400
                
                # Проверка за блокирана дата
                blocked = BlockedDate.query.filter_by(date=appointment.date).first()
                if blocked:
                    print(f"Датата е блокирана: {appointment.date}")
                    return jsonify({'message': 'The selected date is blocked'}), 400
            
            db.session.commit()
            print(f"Резервация с ID {appointment_id} успешно актуализирана")
            
            return jsonify({'appointment': appointment.to_dict()}), 200
        
        except ValueError as e:
            print(f"Грешка при обработка на стойностите: {str(e)}")
            return jsonify({'message': 'Invalid date or time format'}), 400
    except Exception as e:
        db.session.rollback()
        error_msg = f"Грешка при актуализиране на резервация: {str(e)}"
        print(error_msg)
        return jsonify({'message': error_msg}), 500

# Дублиращ маршрут без наклонена черта в края
@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
def update_appointment_alt(appointment_id):
    return update_appointment(appointment_id)

@appointments_bp.route('/<int:appointment_id>/', methods=['DELETE'])
# Временно премахваме @jwt_required() за тестване
def delete_appointment(appointment_id):
    try:
        print(f"Опит за изтриване на резервация с ID: {appointment_id}")
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            print(f"Резервация с ID {appointment_id} не е намерена")
            return jsonify({'message': 'Appointment not found'}), 404
        
        print(f"Намерена резервация: {appointment.to_dict()}")
        db.session.delete(appointment)
        db.session.commit()
        
        print(f"Резервация с ID {appointment_id} успешно изтрита")
        return jsonify({'message': 'Appointment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        error_msg = f"Грешка при изтриване на резервация: {str(e)}"
        print(error_msg)
        return jsonify({'message': error_msg}), 500

# Дублиращ маршрут без наклонена черта в края
@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
def delete_appointment_alt(appointment_id):
    return delete_appointment(appointment_id)

@appointments_bp.route('/available-slots/', methods=['GET'])
def get_available_slots():
    date_str = request.args.get('date')
    service_id = request.args.get('service_id')
    
    print(f"Debug: Received request for available slots with date={date_str}, service_id={service_id}")
    
    if not date_str:
        return jsonify({'message': 'Date parameter is required'}), 400
    
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Make service_id optional - if not provided, use default duration of 30 minutes
        service_duration = 30  # default duration in minutes
        
        if service_id:
            service = Service.query.get(service_id)
            if service:
                service_duration = service.duration
        
        # Check if date is blocked
        blocked = BlockedDate.query.filter_by(date=date).first()
        if blocked:
            return jsonify({'available_slots': [], 'booked_slots': []}), 200
        
        # Get business hours for the day
        day_of_week = date.weekday()
        business_hours = BusinessHours.query.filter_by(day_of_week=day_of_week).first()
        
        if not business_hours or not business_hours.is_open:
            return jsonify({'available_slots': [], 'booked_slots': []}), 200
        
        # Get all appointments for the day
        appointments = Appointment.query.filter_by(date=date).order_by(Appointment.start_time).all()
        print(f"Debug: Found {len(appointments)} existing appointments for {date_str}")
        
        # Calculate available slots
        available_slots = []
        booked_slots = []
        all_slots = []
        current_time = business_hours.open_time
        service_duration_td = timedelta(minutes=service_duration)
        
        print(f"Debug: Generating slots from {current_time} to {business_hours.close_time} with duration {service_duration}")
        
        while True:
            # Convert time to datetime for easier calculation
            current_datetime = datetime.combine(date, current_time)
            end_datetime = current_datetime + service_duration_td
            
            # Check if end time exceeds business hours
            if end_datetime.time() > business_hours.close_time:
                break
            
            # Add to all slots
            current_slot = current_time.strftime('%H:%M')
            all_slots.append(current_slot)
            
            # Check if slot overlaps with any appointment
            is_available = True
            for appointment in appointments:
                appt_start = datetime.combine(date, appointment.start_time)
                appt_end = datetime.combine(date, appointment.end_time)
                
                if (current_datetime < appt_end and end_datetime > appt_start):
                    is_available = False
                    # Add to booked slots if not already present
                    if current_slot not in booked_slots:
                        booked_slots.append(current_slot)
                    break
            
            if is_available:
                available_slots.append(current_slot)
            
            # Move to next slot (30-minute intervals)
            current_datetime += timedelta(minutes=30)
            current_time = current_datetime.time()
        
        print(f"Debug: Generated {len(available_slots)} available slots")
        print(f"Debug: Found {len(booked_slots)} booked slots")
        
        return jsonify({
            'available_slots': available_slots,
            'booked_slots': booked_slots,
            'all_slots': all_slots
        }), 200
    
    except ValueError as e:
        print(f"Debug: Error processing available slots: {str(e)}")
        return jsonify({'message': 'Invalid date format'}), 400
    except Exception as e:
        print(f"Debug: Unexpected error: {str(e)}")
        return jsonify({'message': f'Error retrieving available slots: {str(e)}'}), 500

@appointments_bp.route('/admin/stats/', methods=['GET'])
def get_appointment_stats():
    # Get date range from query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Appointment.query
    
    if start_date:
        query = query.filter(Appointment.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Appointment.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    # Get total appointments
    total_appointments = query.count()
    
    # Get appointments by status
    status_counts = {}
    for status in ['pending', 'confirmed', 'completed', 'cancelled']:
        status_counts[status] = query.filter_by(status=status).count()
    
    # Get total revenue
    total_revenue = db.session.query(db.func.sum(Appointment.price)).filter(
        Appointment.status == 'completed'
    ).scalar() or 0
    
    # Get average rating
    avg_rating = db.session.query(db.func.avg(Appointment.client_rating)).filter(
        Appointment.client_rating.isnot(None)
    ).scalar() or 0
    
    return jsonify({
        'total_appointments': total_appointments,
        'status_counts': status_counts,
        'total_revenue': float(total_revenue),
        'average_rating': float(avg_rating)
    }), 200

@appointments_bp.route('/business-hours/', methods=['GET'])
def get_business_hours():
    business_hours = BusinessHours.query.all()
    return jsonify({'business_hours': [hours.to_dict() for hours in business_hours]}), 200

@appointments_bp.route('/business-hours/', methods=['POST'])
def set_business_hours():
    data = request.get_json()
    
    if not data or not isinstance(data, list):
        return jsonify({'message': 'Invalid data format'}), 400
    
    try:
        # Clear existing business hours
        BusinessHours.query.delete()
        
        for hours_data in data:
            if not all(k in hours_data for k in ('day_of_week', 'is_open', 'open_time', 'close_time')):
                return jsonify({'message': 'Missing required fields'}), 400
            
            open_time = datetime.strptime(hours_data['open_time'], '%H:%M').time() if hours_data['is_open'] else time(0, 0)
            close_time = datetime.strptime(hours_data['close_time'], '%H:%M').time() if hours_data['is_open'] else time(0, 0)
            
            hours = BusinessHours(
                day_of_week=hours_data['day_of_week'],
                is_open=hours_data['is_open'],
                open_time=open_time,
                close_time=close_time
            )
            
            db.session.add(hours)
        
        db.session.commit()
        
        return jsonify({'message': 'Business hours updated successfully'}), 200
    
    except ValueError:
        return jsonify({'message': 'Invalid time format'}), 400

@appointments_bp.route('/blocked-dates/', methods=['GET'])
def get_blocked_dates():
    blocked_dates = BlockedDate.query.order_by(BlockedDate.date).all()
    return jsonify({'blocked_dates': [date.to_dict() for date in blocked_dates]}), 200

@appointments_bp.route('/blocked-dates/', methods=['POST'])
def add_blocked_date():
    data = request.get_json()
    
    if not data or 'date' not in data:
        return jsonify({'message': 'Date is required'}), 400
    
    try:
        blocked_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        # Check if date already exists
        if BlockedDate.query.filter_by(date=blocked_date).first():
            return jsonify({'message': 'Date is already blocked'}), 400
        
        new_blocked_date = BlockedDate(
            date=blocked_date,
            reason=data.get('reason', '')
        )
        
        db.session.add(new_blocked_date)
        db.session.commit()
        
        return jsonify({'blocked_date': new_blocked_date.to_dict()}), 201
    
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

@appointments_bp.route('/blocked-dates/<int:blocked_date_id>/', methods=['DELETE'])
def remove_blocked_date(blocked_date_id):
    blocked_date = BlockedDate.query.get(blocked_date_id)
    
    if not blocked_date:
        return jsonify({'message': 'Blocked date not found'}), 404
    
    db.session.delete(blocked_date)
    db.session.commit()
    
    return jsonify({'message': 'Blocked date removed successfully'}), 200

@appointments_bp.route('/setup-default-business-hours/', methods=['GET'])
def setup_default_business_hours():
    """Create default business hours: Mon-Fri 9:00-20:00, Sat-Sun closed"""
    try:
        # Clear existing business hours
        BusinessHours.query.delete()
        
        # Monday to Friday: 9:00 - 20:00
        for day in range(5):  # 0=Monday, 4=Friday
            db.session.add(BusinessHours(
                day_of_week=day,
                is_open=True,
                open_time=time(9, 0),
                close_time=time(20, 0)
            ))
        
        # Saturday and Sunday: closed
        for day in range(5, 7):  # 5=Saturday, 6=Sunday
            db.session.add(BusinessHours(
                day_of_week=day,
                is_open=False,
                open_time=time(0, 0),
                close_time=time(0, 0)
            ))
        
        db.session.commit()
        
        return jsonify({'message': 'Default business hours set successfully'}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error setting default hours: {str(e)}'}), 500 