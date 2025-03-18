import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Table, Modal } from 'react-bootstrap';
import AdminLayout from '../components/AdminLayout';
import { getServices, createService, updateService, deleteService } from '../utils/api';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentService, setCurrentService] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    duration: ''
  });
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getServices();
      setServices(response.data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({
      ...currentService,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate price and duration
      const price = parseFloat(currentService.price);
      const duration = parseInt(currentService.duration);
      
      if (isNaN(price) || price < 0) {
        setError('Моля, въведете валидна цена');
        return;
      }
      
      if (isNaN(duration) || duration < 1) {
        setError('Моля, въведете валидно времетраене');
        return;
      }
      
      const serviceData = {
        name: currentService.name.trim(),
        description: currentService.description.trim(),
        price: price,
        duration: duration
      };

      if (isEdit) {
        await updateService(currentService.id, serviceData);
        setSuccess('Услугата е обновена успешно');
      } else {
        await createService(serviceData);
        setSuccess('Услугата е създадена успешно');
      }
      
      closeModal();
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      const errorMessage = err.response?.data?.message || 'Грешка при запазване на услугата';
      setError(errorMessage);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) {
      try {
        await deleteService(id);
        setSuccess('Услугата е изтрита успешно');
        fetchServices();
      } catch (err) {
        console.error('Error deleting service:', err);
        const errorMessage = err.response?.data?.message || 'Грешка при изтриване на услугата';
        if (err.response?.data?.appointments_count) {
          setError(`${errorMessage} Брой резервации: ${err.response.data.appointments_count}`);
        } else {
          setError(errorMessage);
        }
      }
    }
  };
  
  const openEditModal = (service) => {
    setCurrentService({
      id: service.id,
      name: service.name || '',
      description: service.description || '',
      price: service.price ? service.price.toString() : '',
      duration: service.duration ? service.duration.toString() : ''
    });
    setIsEdit(true);
    setShowModal(true);
  };
  
  const openCreateModal = () => {
    setCurrentService({
      id: null,
      name: '',
      description: '',
      price: '',
      duration: ''
    });
    setIsEdit(false);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };
  
  return (
    <AdminLayout>
      <h2 className="mb-4">Управление на услуги</h2>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Всички услуги</h4>
          <Button variant="primary" onClick={openCreateModal}>
            Добави нова услуга
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Зареждане...</span>
              </div>
            </div>
          ) : services.length > 0 ? (
            <div className="table-responsive">
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Име на услугата</th>
                    <th>Цена</th>
                    <th>Времетраене</th>
                    <th>Описание</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td>{service.price ? service.price.toFixed(2) : '0.00'} лв.</td>
                      <td>{service.duration} мин.</td>
                      <td>{service.description || '-'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModal(service)}
                          className="me-2"
                        >
                          Редактирай
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          Изтрий
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">Няма намерени услуги. Моля, добавете нова услуга.</Alert>
          )}
        </Card.Body>
      </Card>
      
      {/* Service Form Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Редактиране на услуга' : 'Добавяне на нова услуга'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Име на услугата</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentService.name}
                onChange={handleInputChange}
                required
                placeholder="Въведете име на услугата"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Цена (лв.)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={currentService.price}
                    onChange={handleInputChange}
                    required
                    placeholder="Въведете цена"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Времетраене (минути)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="duration"
                    value={currentService.duration}
                    onChange={handleInputChange}
                    required
                    placeholder="Въведете времетраене"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={currentService.description}
                onChange={handleInputChange}
                placeholder="Въведете описание на услугата"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={closeModal} className="me-2">
                Отказ
              </Button>
              <Button variant="primary" type="submit">
                {isEdit ? 'Запази промените' : 'Създай услуга'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </AdminLayout>
  );
};

export default AdminServices; 