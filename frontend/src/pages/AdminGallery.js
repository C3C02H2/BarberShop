import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Modal } from 'react-bootstrap';
import { FaTrash, FaEdit } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import { getGalleryImages, uploadGalleryImage, updateGalleryImage, deleteGalleryImage } from '../utils/api';

// API URL за достъп до изображения
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await getGalleryImages();
      setImages(response.data.images);
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files.length > 0) {
      setEditFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile) {
      setError('Моля, изберете изображение');
      return;
    }
    
    // Валидация на размера на файла (макс. 5MB)
    if (uploadFile.size > 5 * 1024 * 1024) {
      setError('Изображението е твърде голямо (макс. 5MB)');
      return;
    }
    
    try {
      setIsUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('title', uploadTitle);
      
      console.log('Uploading image:', uploadFile.name, 'with title:', uploadTitle);
      
      const response = await uploadGalleryImage(formData);
      console.log('Upload response:', response.data);
      
      setSuccess('Изображението е качено успешно!');
      setUploadTitle('');
      setUploadFile(null);
      document.getElementById('upload-image').value = '';
      
      // Обновяваме галерията
      fetchGalleryImages();
    } catch (err) {
      console.error('Error uploading image:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        setError(err.response.data.message || 'Грешка при качване на изображението');
      } else {
        setError('Грешка при качване на изображението');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteGalleryImage(id);
        setSuccess('Image deleted successfully');
        fetchGalleryImages();
      } catch (err) {
        console.error('Error deleting image:', err);
        setError('Failed to delete image');
      }
    }
  };

  const handleEditClick = (image) => {
    setEditImage(image);
    setEditTitle(image.title || '');
    setEditFile(null);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      
      if (editFile) {
        formData.append('image', editFile);
      }
      
      await updateGalleryImage(editImage.id, formData);
      
      setSuccess('Image updated successfully');
      setShowEditModal(false);
      fetchGalleryImages();
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Failed to update image');
    }
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">Gallery Management</h2>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>Upload New Image</Card.Header>
        <Card.Body>
          <Form onSubmit={handleImageUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter image title"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Image File*</Form.Label>
              <Form.Control
                id="upload-image"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                required
              />
              <Form.Text className="text-muted">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </Form.Text>
            </Form.Group>
            
            <Button
              variant="primary"
              type="submit"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">Gallery Images</h3>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Row>
          {images.length > 0 ? (
            images.map((image) => (
              <Col md={4} key={image.id} className="mb-4">
                <Card>
                  <Card.Img
                    variant="top"
                    src={`${API_BASE_URL}${image.file_path}`}
                    alt={image.title}
                    className="gallery-image"
                  />
                  <Card.Body>
                    <Card.Title>{image.title || 'Untitled'}</Card.Title>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => handleEditClick(image)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDelete(image.id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <Alert variant="info">No images found in the gallery</Alert>
            </Col>
          )}
        </Row>
      )}
      
      {/* Edit Image Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Gallery Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editImage && (
            <Form onSubmit={handleUpdate}>
              <div className="text-center mb-3">
                <img
                  src={`${API_BASE_URL}${editImage.file_path}`}
                  alt={editImage.title}
                  style={{ maxHeight: '200px', maxWidth: '100%' }}
                />
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter image title"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Replace Image (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleEditFileChange}
                  accept="image/*"
                />
                <Form.Text className="text-muted">
                  Leave empty to keep the current image
                </Form.Text>
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </AdminLayout>
  );
};

export default AdminGallery; 