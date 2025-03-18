import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { FaUser, FaCalendarAlt, FaCut, FaRegClock } from 'react-icons/fa';
import '../styles/navbar.css';

const CustomNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMenu = () => setExpanded(false);

  return (
    <Navbar 
      expand="lg" 
      fixed="top" 
      className={`custom-navbar ${scrolled ? 'scrolled' : ''}`}
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <div className="barber-pole-mini">
          <div className="pole-stripes"></div>
        </div>
        <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
          Бръс<span>нраяТ</span>
        </Navbar.Brand>
        
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="navbar-toggler-custom"
        >
          <div className={`hamburger ${expanded ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </Navbar.Toggle>
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              as={ScrollLink}
              to="home"
              spy={true}
              smooth={true}
              offset={-70}
              duration={500}
              className="nav-link-custom"
              onClick={closeMenu}
            >
              <span className="nav-icon-container">
                <FaCut className="nav-icon" />
              </span>
              Начало
            </Nav.Link>
            
            <Nav.Link 
              as={ScrollLink}
              to="services"
              spy={true}
              smooth={true}
              offset={-70}
              duration={500}
              className="nav-link-custom"
              onClick={closeMenu}
            >
              <span className="nav-icon-container">
                <FaCut className="nav-icon" />
              </span>
              Услуги
            </Nav.Link>
            
            <Nav.Link 
              as={ScrollLink}
              to="gallery"
              spy={true}
              smooth={true}
              offset={-70}
              duration={500}
              className="nav-link-custom"
              onClick={closeMenu}
            >
              Галерия
            </Nav.Link>
            
            <Nav.Link 
              as={ScrollLink}
              to="contact"
              spy={true}
              smooth={true}
              offset={-70}
              duration={500}
              className="nav-link-custom"
              onClick={closeMenu}
            >
              Контакти
            </Nav.Link>
            
            <Nav.Link 
              as={Link}
              to="/admin/login"
              className="nav-link-custom admin-link"
              onClick={closeMenu}
            >
              <FaUser className="icon" /> Админ
            </Nav.Link>
            
            <Nav.Link 
              as={ScrollLink}
              to="booking"
              spy={true}
              smooth={true}
              offset={-70}
              duration={500}
              className="nav-link-booking"
              onClick={closeMenu}
            >
              <FaRegClock className="icon" /> Резервирай сега
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar; 