import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaImages, FaClock, FaCut, FaUser, FaMoneyBillWave, FaChartBar } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import { getAppointments, getGalleryImages, getServices, getAppointmentStats } from '../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    appointments: 0,
    services: 0,
    gallery: 0,
    upcomingAppointments: [],
    revenue: 0,
    statusCounts: {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Първо зареждаме основните данни
      const [appointmentsRes, servicesRes, galleryRes] = await Promise.all([
        getAppointments(),
        getServices(),
        getGalleryImages()
      ]);
      
      const appointments = appointmentsRes.data.appointments;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingAppointments = appointments
        .filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate >= today;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.start_time}`);
          const dateB = new Date(`${b.date}T${b.start_time}`);
          return dateA - dateB;
        })
        .slice(0, 5);
      
      // Опитваме да заредим статистиките отделно, но не спираме целия процес, ако той се провали
      let statusCounts = {
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      };
      
      let revenue = appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.price || 0), 0);
      
      // Опитваме се да заредим статистика от API, ако има такава
      try {
        const statsRes = await getAppointmentStats();
        if (statsRes?.data) {
          if (statsRes.data.status_counts) {
            statusCounts = statsRes.data.status_counts;
          }
          if (statsRes.data.total_revenue !== undefined) {
            revenue = statsRes.data.total_revenue;
          }
        }
      } catch (statsError) {
        console.warn('Could not fetch appointment stats:', statsError);
        // Използваме изчислените стойности от по-горе
      }
      
      setStats({
        appointments: appointments.length,
        services: servicesRes.data.services.length,
        gallery: galleryRes.data.images.length,
        upcomingAppointments,
        revenue,
        statusCounts
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const today = new Date().toLocaleDateString('bg-BG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <AdminLayout>
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner"></div>
        </div>
      ) : (
        <>
          <Card className="admin-card mb-4">
            <Card.Body className="p-4">
              <h5>Добре дошли отново!</h5>
              <p className="text-muted mb-0">{today}</p>
            </Card.Body>
          </Card>
          
          <Row>
            <Col lg={3} md={6} className="mb-4">
              <Card className="admin-card h-100">
                <Card.Body className="admin-card-stats">
                  <div className="stats-icon bg-primary-light text-primary">
                    <FaCalendarAlt />
                  </div>
                  <div className="stats-number">{stats.appointments}</div>
                  <div className="stats-text">Общо резервации</div>
                </Card.Body>
                <Card.Footer className="bg-white border-0 py-2">
                  <Link to="/admin/appointments" className="text-primary d-block text-center">
                    Виж всички
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="admin-card h-100">
                <Card.Body className="admin-card-stats">
                  <div className="stats-icon bg-success-light text-success">
                    <FaMoneyBillWave />
                  </div>
                  <div className="stats-number">{stats.revenue.toFixed(2)} лв</div>
                  <div className="stats-text">Общи приходи</div>
                </Card.Body>
                <Card.Footer className="bg-white border-0 py-2">
                  <Link to="/admin/appointments" className="text-success d-block text-center">
                    Подробности
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="admin-card h-100">
                <Card.Body className="admin-card-stats">
                  <div className="stats-icon bg-info-light text-info">
                    <FaCut />
                  </div>
                  <div className="stats-number">{stats.services}</div>
                  <div className="stats-text">Активни услуги</div>
                </Card.Body>
                <Card.Footer className="bg-white border-0 py-2">
                  <Link to="/admin/services" className="text-info d-block text-center">
                    Управление
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="admin-card h-100">
                <Card.Body className="admin-card-stats">
                  <div className="stats-icon bg-warning-light text-warning">
                    <FaImages />
                  </div>
                  <div className="stats-number">{stats.gallery}</div>
                  <div className="stats-text">Снимки в галерията</div>
                </Card.Body>
                <Card.Footer className="bg-white border-0 py-2">
                  <Link to="/admin/gallery" className="text-warning d-block text-center">
                    Управление
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col lg={8} className="mb-4">
              <Card className="admin-card h-100">
                <Card.Header className="admin-card-header">
                  <h5 className="admin-card-title">Предстоящи резервации</h5>
                </Card.Header>
                <Card.Body>
                  {stats.upcomingAppointments.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Час</th>
                          <th>Клиент</th>
                          <th>Услуга</th>
                          <th>Телефон</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.upcomingAppointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{formatDate(appointment.date)}</td>
                            <td>{appointment.start_time}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2 bg-light rounded-circle p-1">
                                  <FaUser size={14} />
                                </div>
                                {appointment.name}
                              </div>
                            </td>
                            <td>{appointment.service_name}</td>
                            <td>{appointment.phone}</td>
                            <td>
                              <span className={`status-badge status-${appointment.status || 'pending'}`}>
                                {appointment.status || 'Чакаща'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-5">
                      <FaCalendarAlt size={40} className="text-muted mb-3" />
                      <p className="mb-0">Няма предстоящи резервации</p>
                    </div>
                  )}
                </Card.Body>
                {stats.upcomingAppointments.length > 0 && (
                  <Card.Footer className="bg-white border-0 py-3">
                    <Link to="/admin/appointments" className="btn admin-btn admin-btn-primary">
                      Виж всички резервации
                    </Link>
                  </Card.Footer>
                )}
              </Card>
            </Col>
            
            <Col lg={4}>
              <Card className="admin-card mb-4">
                <Card.Header className="admin-card-header">
                  <h5 className="admin-card-title">Статистика резервации</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-column">
                    <div className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="status-badge status-pending me-2"></div>
                          <span>Чакащи</span>
                        </div>
                        <strong>{stats.statusCounts.pending}</strong>
                      </div>
                      <div className="progress mt-1" style={{height: '6px'}}>
                        <div className="progress-bar bg-warning" style={{width: `${(stats.statusCounts.pending / stats.appointments) * 100}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="status-badge status-confirmed me-2"></div>
                          <span>Потвърдени</span>
                        </div>
                        <strong>{stats.statusCounts.confirmed}</strong>
                      </div>
                      <div className="progress mt-1" style={{height: '6px'}}>
                        <div className="progress-bar bg-info" style={{width: `${(stats.statusCounts.confirmed / stats.appointments) * 100}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="status-badge status-completed me-2"></div>
                          <span>Завършени</span>
                        </div>
                        <strong>{stats.statusCounts.completed}</strong>
                      </div>
                      <div className="progress mt-1" style={{height: '6px'}}>
                        <div className="progress-bar bg-success" style={{width: `${(stats.statusCounts.completed / stats.appointments) * 100}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="status-badge status-cancelled me-2"></div>
                          <span>Отказани</span>
                        </div>
                        <strong>{stats.statusCounts.cancelled}</strong>
                      </div>
                      <div className="progress mt-1" style={{height: '6px'}}>
                        <div className="progress-bar bg-danger" style={{width: `${(stats.statusCounts.cancelled / stats.appointments) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="admin-card">
                <Card.Header className="admin-card-header">
                  <h5 className="admin-card-title">Бързи действия</h5>
                </Card.Header>
                <Card.Body>
                  <Link to="/admin/appointments" className="btn admin-btn admin-btn-primary w-100 mb-2">
                    <FaCalendarAlt className="me-2" /> Управление на резервации
                  </Link>
                  <Link to="/admin/services" className="btn admin-btn admin-btn-success w-100 mb-2">
                    <FaCut className="me-2" /> Управление на услуги
                  </Link>
                  <Link to="/admin/gallery" className="btn admin-btn admin-btn-danger w-100">
                    <FaImages className="me-2" /> Управление на галерия
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard; 