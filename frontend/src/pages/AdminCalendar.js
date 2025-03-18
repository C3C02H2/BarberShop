import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Table } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import AdminLayout from '../components/AdminLayout';
import { getBusinessHours, setBusinessHours, getBlockedDates, addBlockedDate, removeBlockedDate } from '../utils/api';

const AdminCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Business hours state
  const [businessHours, setBusinessHoursState] = useState([]);
  const [isUpdatingHours, setIsUpdatingHours] = useState(false);
  
  // Blocked dates state
  const [blockedDates, setBlockedDatesState] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [isAddingBlockedDate, setIsAddingBlockedDate] = useState(false);

  useEffect(() => {
    fetchBusinessHours();
    fetchBlockedDates();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      const response = await getBusinessHours();
      
      // Initialize with default values if none exist
      if (response.data.business_hours.length === 0) {
        const defaultHours = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          is_open: i < 5, // Monday-Friday open, weekend closed
          open_time: '10:00',
          close_time: '19:00'
        }));
        setBusinessHoursState(defaultHours);
      } else {
        setBusinessHoursState(
          response.data.business_hours.map(hour => ({
            ...hour,
            open_time: hour.open_time.slice(0, 5),
            close_time: hour.close_time.slice(0, 5)
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching business hours:', err);
      setError('Failed to load business hours');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const response = await getBlockedDates();
      setBlockedDatesState(response.data.blocked_dates);
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
      setError('Failed to load blocked dates');
    }
  };

  const handleBusinessHoursChange = (index, field, value) => {
    const updatedHours = [...businessHours];
    
    if (field === 'is_open') {
      updatedHours[index].is_open = value;
    } else {
      updatedHours[index][field] = value;
    }
    
    setBusinessHoursState(updatedHours);
  };

  const handleUpdateBusinessHours = async () => {
    try {
      setIsUpdatingHours(true);
      await setBusinessHours(businessHours);
      setSuccess('Business hours updated successfully');
    } catch (err) {
      console.error('Error updating business hours:', err);
      setError('Failed to update business hours');
    } finally {
      setIsUpdatingHours(false);
    }
  };

  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setError('Please select a date to block');
      return;
    }
    
    try {
      setIsAddingBlockedDate(true);
      
      await addBlockedDate({
        date: format(selectedDate, 'yyyy-MM-dd'),
        reason: blockReason
      });
      
      setSuccess('Date blocked successfully');
      setSelectedDate(null);
      setBlockReason('');
      fetchBlockedDates();
    } catch (err) {
      console.error('Error adding blocked date:', err);
      setError(err.response?.data?.message || 'Failed to block date');
    } finally {
      setIsAddingBlockedDate(false);
    }
  };

  const handleRemoveBlockedDate = async (id) => {
    if (window.confirm('Are you sure you want to unblock this date?')) {
      try {
        await removeBlockedDate(id);
        setSuccess('Date unblocked successfully');
        fetchBlockedDates();
      } catch (err) {
        console.error('Error removing blocked date:', err);
        setError('Failed to unblock date');
      }
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek];
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isDateBlocked = (date) => {
    return blockedDates.some(blockedDate => 
      new Date(blockedDate.date).toDateString() === date.toDateString()
    );
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">Calendar Management</h2>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      
      <Row>
        <Col md={7}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Business Hours</h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Open/Closed</th>
                        <th>Opening Time</th>
                        <th>Closing Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessHours.map((hours, index) => (
                        <tr key={index}>
                          <td>{getDayName(hours.day_of_week)}</td>
                          <td>
                            <Form.Check
                              type="switch"
                              id={`day-switch-${index}`}
                              checked={hours.is_open}
                              onChange={(e) => handleBusinessHoursChange(index, 'is_open', e.target.checked)}
                              label={hours.is_open ? 'Open' : 'Closed'}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              value={hours.open_time}
                              onChange={(e) => handleBusinessHoursChange(index, 'open_time', e.target.value)}
                              disabled={!hours.is_open}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              value={hours.close_time}
                              onChange={(e) => handleBusinessHoursChange(index, 'close_time', e.target.value)}
                              disabled={!hours.is_open}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  <Button
                    variant="primary"
                    onClick={handleUpdateBusinessHours}
                    disabled={isUpdatingHours}
                  >
                    {isUpdatingHours ? 'Updating...' : 'Update Business Hours'}
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Block Dates</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddBlockedDate}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Date to Block</Form.Label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="form-control"
                    filterDate={(date) => !isDateBlocked(date)}
                    placeholderText="Select a date to block"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Reason (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Enter a reason for blocking this date"
                  />
                </Form.Group>
                
                <Button
                  variant="danger"
                  type="submit"
                  disabled={isAddingBlockedDate || !selectedDate}
                >
                  {isAddingBlockedDate ? 'Blocking...' : 'Block Date'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h4 className="mb-0">Blocked Dates</h4>
            </Card.Header>
            <Card.Body>
              {blockedDates.length > 0 ? (
                <div className="table-responsive">
                  <Table bordered hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedDates.map((blockedDate) => (
                        <tr key={blockedDate.id}>
                          <td>{formatDate(blockedDate.date)}</td>
                          <td>{blockedDate.reason || 'No reason provided'}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveBlockedDate(blockedDate.id)}
                            >
                              Unblock
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">No blocked dates</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default AdminCalendar; 