import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Row, Col, Badge } from 'react-bootstrap';
import { format, parseISO, isEqual } from 'date-fns';
import { bg } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import AdminLayout from '../components/AdminLayout';
import { getAppointments, getServices, deleteAppointment, updateAppointment } from '../utils/api';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('pending');
  const [barberNotes, setBarberNotes] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedFilterDate) {
      const filtered = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        const filterDate = new Date(selectedFilterDate);
        filterDate.setHours(0, 0, 0, 0);
        return isEqual(appointmentDate, filterDate);
      });
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [selectedFilterDate, appointments]);

  const formatDate = (dateString) => {
    try {
      // Проверка дали имаме валидна дата
      if (!dateString) return 'Невалидна дата';
      
      // Преобразуване на ISO дата към обект Date
      const date = parseISO(dateString);
      
      // Проверка за валидност на датата
      if (isNaN(date.getTime())) return 'Невалидна дата';
      
      // Форматиране на датата на български (дд.мм.гггг)
      return format(date, 'dd.MM.yyyy', { locale: bg });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Грешка във формата';
    }
  };
  
  const formatTime = (timeString) => {
    try {
      // Проверка дали имаме валиден час
      if (!timeString) return '';
      
      // Ако времето е вече във формат ЧЧ:ММ, връщаме го директно
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return timeString;
      }
      
      // В противен случай се опитваме да го форматираме
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return timeString;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge bg="warning">Чакаща</Badge>;
      case 'confirmed':
        return <Badge bg="info">Потвърдена</Badge>;
      case 'completed':
        return <Badge bg="success">Завършена</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Отказана</Badge>;
      default:
        return <Badge bg="secondary">Неизвестно</Badge>;
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      console.log('Fetching appointments...');
      const response = await getAppointments();
      console.log('Appointments response:', response.data);
      
      if (response.data && response.data.appointments) {
        if (response.data.appointments.length === 0) {
          console.log('No appointments found');
        } else {
          console.log(`Found ${response.data.appointments.length} appointments`);
        }
        
        // Sort appointments by date (newest first) and time
        const sortedAppointments = response.data.appointments.sort((a, b) => {
          // First compare by date (newest first)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA > dateB) return -1;
          if (dateA < dateB) return 1;
          
          // If same date, compare by time
          const timeA = a.start_time;
          const timeB = b.start_time;
          return timeA.localeCompare(timeB);
        });
        
        setAppointments(sortedAppointments);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      
      if (err.response) {
        // The request was made and the server responded with an error status
        console.error('Server error:', err.response.status, err.response.data);
        setError(`Failed to load appointments: ${err.response.data.message || 'Server error'}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('Failed to load appointments: No response from server');
      } else {
        // Something happened in setting up the request
        setError(`Failed to load appointments: ${err.message}`);
      }
      
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await getServices();
      setServices(response.data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(id);
        setSuccess('Appointment deleted successfully');
        fetchAppointments();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError('Failed to delete appointment');
      }
    }
  };

  const handleEditAppointment = (appointment) => {
    setCurrentAppointment(appointment);
    setName(appointment.name);
    setPhone(appointment.phone);
    setSelectedDate(new Date(appointment.date));
    setSelectedTime(appointment.start_time);
    setSelectedService(appointment.service_id.toString());
    setMessage(appointment.message || '');
    setStatus(appointment.status || 'pending');
    setBarberNotes(appointment.barber_notes || '');
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const updateData = {
        name,
        phone,
        service_id: selectedService,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        message,
        status,
        barber_notes: barberNotes
      };
      
      await updateAppointment(currentAppointment.id, updateData);
      
      setSuccess('Appointment updated successfully');
      fetchAppointments();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;
      
      const updateData = {
        ...appointment,
        status: newStatus
      };
      
      await updateAppointment(id, updateData);
      setSuccess(`Резервацията e ${newStatus === 'confirmed' ? 'потвърдена' : newStatus === 'completed' ? 'завършена' : 'отказана'} успешно`);
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status');
    }
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">Управление на резервации</h2>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      
      <div className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Филтрирай по дата</Form.Label>
              <div className="d-flex gap-2">
                <DatePicker
                  selected={selectedFilterDate}
                  onChange={(date) => setSelectedFilterDate(date)}
                  dateFormat="dd.MM.yyyy"
                  isClearable
                  placeholderText="Избери дата"
                  className="form-control"
                />
                {selectedFilterDate && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSelectedFilterDate(null)}
                  >
                    Изчисти
                  </Button>
                )}
              </div>
            </Form.Group>
          </Col>
        </Row>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {filteredAppointments.length === 0 ? (
            <Alert variant="info">
              {selectedFilterDate 
                ? `Няма намерени резервации за ${format(selectedFilterDate, 'dd.MM.yyyy')}` 
                : 'Няма намерени резервации'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Час</th>
                    <th>Клиент</th>
                    <th>Телефон</th>
                    <th>Услуга</th>
                    <th>Съобщение</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.date)}</td>
                      <td>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</td>
                      <td>{appointment.name}</td>
                      <td>{appointment.phone}</td>
                      <td>{appointment.service_name}</td>
                      <td>{appointment.message}</td>
                      <td>{getStatusBadge(appointment.status)}</td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex gap-1 mb-1">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                            >
                              Delete
                            </Button>
                          </div>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="info" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleQuickStatusChange(appointment.id, 'confirmed')}
                            >
                              Потвърди
                            </Button>
                            <Button 
                              variant="success" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleQuickStatusChange(appointment.id, 'completed')}
                            >
                              Завърши
                            </Button>
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => handleQuickStatusChange(appointment.id, 'cancelled')}
                            >
                              Откажи
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {/* Edit Appointment Modal */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleUpdateAppointment}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Client Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="MMMM d, yyyy"
                        className="form-control"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time</Form.Label>
                      <Form.Control 
                        type="time" 
                        value={selectedTime} 
                        onChange={(e) => setSelectedTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Service</Form.Label>
                  <Form.Select 
                    value={selectedService} 
                    onChange={(e) => setSelectedService(e.target.value)}
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Чакаща</option>
                    <option value="confirmed">Потвърдена</option>
                    <option value="completed">Завършена</option>
                    <option value="cancelled">Отказана</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Barber Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={barberNotes} 
                    onChange={(e) => setBarberNotes(e.target.value)}
                    placeholder="Бележки от бръснаря (видими само в админ панела)"
                  />
                </Form.Group>
                
                <div className="d-flex justify-content-end">
                  <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Appointment'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminAppointments; 