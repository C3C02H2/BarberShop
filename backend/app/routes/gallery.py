import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from ..models import GalleryImage
from .. import db

gallery_bp = Blueprint('gallery', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@gallery_bp.route('/', methods=['GET'])
def get_gallery_images():
    images = GalleryImage.query.order_by(GalleryImage.created_at.desc()).all()
    return jsonify({'images': [image.to_dict() for image in images]}), 200

@gallery_bp.route('/<int:image_id>', methods=['GET'])
def get_gallery_image(image_id):
    image = GalleryImage.query.get(image_id)
    
    if not image:
        return jsonify({'message': 'Image not found'}), 404
    
    return jsonify({'image': image.to_dict()}), 200

# Алтернативен маршрут с наклонена черта в края
@gallery_bp.route('/<int:image_id>/', methods=['GET'])
def get_gallery_image_alt(image_id):
    return get_gallery_image(image_id)

@gallery_bp.route('/', methods=['POST'])
def upload_gallery_image():
    try:
        current_app.logger.info("Starting image upload...")
        
        # Print all form data for debugging
        for key, value in request.form.items():
            current_app.logger.info(f"Form field {key}: {value}")
        
        # Print all files for debugging
        for key, file in request.files.items():
            current_app.logger.info(f"Received file with key {key}: {file.filename}")
        
        # Проверка дали директорията съществува и дали имаме права за запис
        static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')
        upload_folder = os.path.join(static_folder, 'uploads')
        
        # Гарантираме, че директориите съществуват
        os.makedirs(static_folder, exist_ok=True)
        os.makedirs(upload_folder, exist_ok=True)
        current_app.logger.info(f"Upload directory path: {upload_folder}")
        
        if not os.access(upload_folder, os.W_OK):
            current_app.logger.error(f"No write permission to directory: {upload_folder}")
            return jsonify({'message': 'Server configuration error: No write permission to upload directory'}), 500
            
        # Проверка дали е предоставен файл
        if 'image' not in request.files:
            current_app.logger.error("No 'image' field in request.files")
            current_app.logger.error(f"Available fields: {list(request.files.keys())}")
            current_app.logger.error(f"Request method: {request.method}")
            current_app.logger.error(f"Content type: {request.content_type}")
            current_app.logger.error(f"Request data: {request.data}")
            return jsonify({'message': 'No image provided'}), 400
        
        file = request.files['image']
        current_app.logger.info(f"Received file: {file.filename}, type: {file.content_type}")
        
        if file.filename == '':
            return jsonify({'message': 'No image selected'}), 400
        
        if file and allowed_file(file.filename):
            # Генерираме уникално име на файла, за да избегнем колизии
            import uuid
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            file_path = os.path.join(upload_folder, filename)
            current_app.logger.info(f"Saving file to: {file_path}")
            
            try:
                file.save(file_path)
                current_app.logger.info(f"File saved successfully to: {file_path}")
            except Exception as e:
                current_app.logger.error(f"Error saving file: {str(e)}")
                return jsonify({'message': f'Error saving file: {str(e)}'}), 500
            
            gallery_image = GalleryImage(
                title=request.form.get('title', ''),
                file_path=f'/static/uploads/{filename}'
            )
            
            db.session.add(gallery_image)
            db.session.commit()
            current_app.logger.info(f"Gallery image record created: {gallery_image.id}")
            
            return jsonify({'image': gallery_image.to_dict()}), 201
        
        return jsonify({'message': 'Invalid file type'}), 400
    except Exception as e:
        current_app.logger.error(f"Unhandled exception in upload_gallery_image: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@gallery_bp.route('/<int:image_id>', methods=['PUT'])
# Временно премахнато: @jwt_required()
def update_gallery_image(image_id):
    try:
        current_app.logger.info(f"Опит за актуализиране на изображение с ID: {image_id}")
        image = GalleryImage.query.get(image_id)
        
        if not image:
            current_app.logger.error(f"Изображение с ID {image_id} не е намерено")
            return jsonify({'message': 'Image not found'}), 404
        
        current_app.logger.info(f"Form data: {request.form}")
        current_app.logger.info(f"Files: {request.files}")
        
        if 'title' in request.form:
            image.title = request.form['title']
            current_app.logger.info(f"Новото заглавие: {image.title}")
        
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                # Remove old image if exists
                if image.file_path:
                    old_file_path = os.path.join(current_app.root_path, image.file_path.lstrip('/'))
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                        current_app.logger.info(f"Изтрито старо изображение: {old_file_path}")
                
                # Генерираме уникално име на файла, за да избегнем колизии
                import uuid
                filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                
                # Проверка дали директорията за качване съществува
                static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')
                upload_folder = os.path.join(static_folder, 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                
                file_path = os.path.join(upload_folder, filename)
                current_app.logger.info(f"Запазване на файл в: {file_path}")
                
                file.save(file_path)
                image.file_path = f'/static/uploads/{filename}'
                current_app.logger.info(f"Нов път към файла: {image.file_path}")
        
        db.session.commit()
        current_app.logger.info(f"Изображение с ID {image_id} успешно актуализирано")
        
        return jsonify({'image': image.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        error_msg = f"Грешка при актуализиране на изображение: {str(e)}"
        current_app.logger.error(error_msg)
        return jsonify({'message': error_msg}), 500

# Алтернативен маршрут с наклонена черта в края
@gallery_bp.route('/<int:image_id>/', methods=['PUT'])
def update_gallery_image_alt(image_id):
    return update_gallery_image(image_id)

@gallery_bp.route('/<int:image_id>', methods=['DELETE'])
# Временно премахнато: @jwt_required()
def delete_gallery_image(image_id):
    try:
        current_app.logger.info(f"Опит за изтриване на изображение с ID: {image_id}")
        image = GalleryImage.query.get(image_id)
        
        if not image:
            current_app.logger.error(f"Изображение с ID {image_id} не е намерено")
            return jsonify({'message': 'Image not found'}), 404
        
        # Remove image file
        if image.file_path:
            file_path = os.path.join(current_app.root_path, image.file_path.lstrip('/'))
            if os.path.exists(file_path):
                os.remove(file_path)
                current_app.logger.info(f"Изтрит файл: {file_path}")
        
        db.session.delete(image)
        db.session.commit()
        current_app.logger.info(f"Изображение с ID {image_id} успешно изтрито")
        
        return jsonify({'message': 'Image deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        error_msg = f"Грешка при изтриване на изображение: {str(e)}"
        current_app.logger.error(error_msg)
        return jsonify({'message': error_msg}), 500

# Алтернативен маршрут с наклонена черта в края
@gallery_bp.route('/<int:image_id>/', methods=['DELETE'])
def delete_gallery_image_alt(image_id):
    return delete_gallery_image(image_id) 