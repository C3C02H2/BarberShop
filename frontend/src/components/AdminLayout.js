import React, { useState } from 'react';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaCalendarAlt, FaImages, FaClipboardList, FaSignOutAlt, FaCog, FaBars, FaTimes, FaComments } from 'react-icons/fa';
import '../styles/admin.css';

const AdminLayout = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleLogout = () => {
    if (auth) {
      auth.logout();
      navigate('/admin/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="admin-container">
      <div className={`admin-sidebar ${sidebarVisible ? '' : 'show'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <img src="/assets/logo-small.png" alt="Logo" className="me-2" />
            <span>БръснарЯт</span>
          </div>
        </div>
        <div className="admin-sidebar-nav">
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin"
                className={location.pathname === '/admin' ? 'active' : ''}
              >
                <FaClipboardList /> <span>Dashboard</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/appointments"
                className={location.pathname === '/admin/appointments' ? 'active' : ''}
              >
                <FaCalendarAlt /> <span>Резервации</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/services"
                className={location.pathname === '/admin/services' ? 'active' : ''}
              >
                <FaCog /> <span>Услуги</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/gallery"
                className={location.pathname === '/admin/gallery' ? 'active' : ''}
              >
                <FaImages className="me-2" /> Галерия
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/reviews"
                className={location.pathname === '/admin/reviews' ? 'active' : ''}
              >
                <FaComments className="me-2" /> Отзиви
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/calendar"
                className={location.pathname === '/admin/calendar' ? 'active' : ''}
              >
                <FaCalendarAlt /> <span>Календар</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={handleLogout}>
                <FaSignOutAlt /> <span>Изход</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-content-header">
          <Row className="align-items-center">
            <Col>
              <Button 
                variant="light" 
                className="d-md-none me-2 p-1" 
                onClick={toggleSidebar}
              >
                {sidebarVisible ? <FaTimes /> : <FaBars />}
              </Button>
              <h1 className="admin-page-title">
                {location.pathname === '/admin' && 'Табло за управление'}
                {location.pathname === '/admin/appointments' && 'Резервации'}
                {location.pathname === '/admin/services' && 'Услуги'}
                {location.pathname === '/admin/gallery' && 'Галерия'}
                {location.pathname === '/admin/calendar' && 'Календар'}
              </h1>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center">
                <span className="me-2">{auth?.user?.email}</span>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={handleLogout}
                  className="d-none d-md-block"
                >
                  <FaSignOutAlt className="me-1" /> Изход
                </Button>
              </div>
            </Col>
          </Row>
        </div>
        
        <div className="fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 