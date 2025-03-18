import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { FaRegClock, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaCut, FaBath, FaCheck } from 'react-icons/fa';
import CustomNavbar from '../components/Navbar';
import { getServices, getGalleryImages, createAppointment, getAvailableSlots, createReview, getReviews } from '../utils/api';
import { Link } from 'react-router-dom';
import '../styles/home.css';

// API URL за достъп до изображения
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviews, setReviews] = useState([]);

  // Временни услуги за бръснарницата (ще се заменят с данни от API)
  const barberServices = [
    {
      id: 1,
      name: "Коса (30 мин)",
      description: "Професионално подстригване с ножица и машинка, включващо измиване и стайлинг.",
      duration: 30,
      price: 25,
      image_path: "../assets/haircut.jpg"
    },
    {
      id: 2,
      name: "Коса и брада (60 мин)",
      description: "Комплексна услуга, включваща подстригване на коса и оформяне на брада.",
      duration: 60,
      price: 40,
      image_path: "../assets/beard-trim.jpg"
    }
  ];

  // Временни снимки за галерията (ще се заменят с данни от API)
  const barberGalleryImages = [
    {
      id: 1,
      file_path: "../assets/gallery1.jpg",
      title: "Класическа прическа"
    },
    {
      id: 2,
      file_path: "../assets/gallery2.jpg",
      title: "Модерна прическа"
    },
    {
      id: 3,
      file_path: "../assets/gallery3.jpg",
      title: "Оформяне на брада"
    },
    {
      id: 4,
      file_path: "../assets/gallery4.jpg",
      title: "Нашият салон"
    },
    {
      id: 5,
      file_path: "../assets/gallery5.jpg",
      title: "Професионални бръсначи"
    },
    {
      id: 6,
      file_path: "../assets/gallery6.jpg",
      title: "Подстригване с машинка"
    }
  ];

  useEffect(() => {
    fetchServices();
    fetchGalleryImages();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, selectedDate]);

  const fetchServices = async () => {
    try {
      const response = await getServices();
      if (response.data.services && response.data.services.length > 0) {
        setServices(response.data.services);
      } else {
        setServices(barberServices); // Използваме временните данни
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices(barberServices); // Използваме временните данни при грешка
    }
  };

  const fetchGalleryImages = async () => {
    try {
      const response = await getGalleryImages();
      if (response.data.images && response.data.images.length > 0) {
        setGalleryImages(response.data.images);
      } else {
        // Вместо да показваме временни данни, показваме празен масив
        setGalleryImages([]);
      }
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      // Вместо да показваме временни данни, показваме празен масив
      setGalleryImages([]);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Generate all possible time slots for the day
      const allTimeSlots = [];
      for (let hour = 9; hour <= 20; hour++) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 20) { // Don't add 20:30 as it's outside business hours
          allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Requesting available slots for date:', formattedDate, 'service_id:', selectedService);
      
      // If no service is selected, show all slots as available
      if (!selectedService) {
        console.log('No service selected, showing all time slots');
        setAvailableSlots(allTimeSlots);
        return;
      }
      
      try {
        const response = await getAvailableSlots(formattedDate, selectedService);
        console.log('Available slots response:', response.data);
        
        if (response.data) {
          if (response.data.available_slots) {
            console.log('Available slots:', response.data.available_slots);
            setAvailableSlots(response.data.available_slots);
          } else {
            setAvailableSlots([]);
          }
          
          // Използваме директно върнатите запазени часове от API
          if (response.data.booked_slots) {
            console.log('Booked slots:', response.data.booked_slots);
            window.bookedTimeSlots = response.data.booked_slots;
          } else {
            window.bookedTimeSlots = [];
          }
        } else {
          console.error('Invalid response format:', response.data);
          setError('Invalid response from server');
          setAvailableSlots(allTimeSlots);
          window.bookedTimeSlots = [];
        }
      } catch (err) {
        console.error('Error getting available slots from server:', err);
        setAvailableSlots(allTimeSlots);
        window.bookedTimeSlots = [];
      }
    } catch (err) {
      console.error('Error in fetchAvailableSlots:', err);
      
      // Generate all time slots as a fallback
      const allTimeSlots = [];
      for (let hour = 9; hour <= 20; hour++) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 20) {
          allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
      
      setAvailableSlots(allTimeSlots);
      window.bookedTimeSlots = [];
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await getReviews();
      if (response.data.reviews) {
        setReviews(response.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePhone(phone)) {
      setPhoneError('Моля, въведете валиден телефонен номер');
      return;
    }
    setPhoneError('');

    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) {
      setError('Моля, попълнете всички задължителни полета');
      return;
    }

    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const appointmentData = {
        service_id: selectedService,
        name,
        phone,
        message,
        date: formattedDate,
        start_time: selectedTime
      };

      await createAppointment(appointmentData);
      setSuccess('Часът е успешно резервиран!');
      
      // Reset form
      setSelectedService('');
      setSelectedDate(null);
      setSelectedTime('');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error('Error booking appointment:', err);
      
      // Показваме грешката, само ако не сме в демо режим
      if (process.env.NODE_ENV !== 'development') {
        setError(err.response?.data?.message || 'Неуспешна резервация');
      } else {
        // За демонстрация показваме успешно съобщение
        setSuccess('Часът е успешно резервиран! (Демо режим)');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewSuccess(false);
    setReviewError('');

    if (!reviewName || !reviewText || !reviewRating) {
      setReviewError('Моля, попълнете всички задължителни полета и дайте оценка');
      setIsSubmittingReview(false);
      return;
    }

    try {
      await createReview({
        client_name: reviewName,
        rating: reviewRating,
        text: reviewText
      });

      setReviewSuccess(true);
      setReviewName('');
      setReviewRating(0);
      setReviewText('');
      
      // Обновяваме списъка с отзиви
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Неуспешно изпращане на отзива. Моля, опитайте отново.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <CustomNavbar />
      
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-background"></div>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="hero-content">
              <span className="barber-badge">От 1985</span>
              <h1 className="hero-title">БръснаряТ</h1>
              <p className="hero-subtitle">Традиция и професионализъм</p>
              <p className="hero-description">
                Авторитетна бръснарница с дългогодишни традиции. Подстригване, бръснене и 
                стайлинг за истински джентълмени от опитни бръснари.
              </p>
              <div className="hero-buttons">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="btn btn-primary"
                  onClick={() => {
                    const bookingSection = document.getElementById('booking');
                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Резервирай час
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="btn btn-outline"
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Нашите услуги
                </Button>
              </div>
            </Col>
            <Col lg={6} className="hero-image-container">
              <img 
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80" 
                alt="Barber Shop" 
                className="hero-image"
              />
              <div className="barber-pole-large">
                <div className="pole-stripes"></div>
              </div>
              <div className="accent-circle accent-circle-1"></div>
              <div className="accent-circle accent-circle-2"></div>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Качества секция */}
      <section className="features-section">
        <Container>
          <div className="barber-stripe"></div>
          <Row>
            <Col md={4} className="mb-4">
              <div className="feature-item">
                <FaCut className="feature-icon" />
                <h3>Майсторски ръце</h3>
                <p>Нашите бръснари имат дългогодишен опит и внимание към детайла.</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="feature-item">
                <FaBath className="feature-icon" />
                <h3>Качествени продукти</h3>
                <p>Използваме само първокласни продукти за грижа за косата и брадата.</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="feature-item">
                <FaRegClock className="feature-icon" />
                <h3>Уважение към времето</h3>
                <p>Ценим вашето време със стриктен график и без закъснения.</p>
              </div>
            </Col>
          </Row>
          <div className="barber-stripe"></div>
        </Container>
      </section>
      
      {/* Services Section */}
      <section id="services" className="section services-section">
        <div className="barber-tools-bg"></div>
        <Container>
          <div className="services-heading">
            <h2 className="services-title">Нашите Услуги</h2>
            <p className="services-description">Професионални услуги за истински джентълмени</p>
          </div>
          
          <Row>
            {services.map((service) => (
              <Col md={4} key={service.id} className="mb-4">
                <Card className="service-card h-100">
                  {service.image_path && (
                    <Card.Img 
                      variant="top" 
                      src={service.image_path.startsWith('http') ? service.image_path : `${API_BASE_URL}${service.image_path}`} 
                      alt={service.name}
                      className="service-img" 
                    />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="service-title">{service.name}</Card.Title>
                    <Card.Text className="service-description">{service.description}</Card.Text>
                    <div className="service-details">
                      <div className="service-duration">
                        <FaRegClock />
                        <span>{service.duration} мин</span>
                      </div>
                    </div>
                    <Button 
                      variant="primary"
                      className="service-book-btn"
                      onClick={() => {
                        setSelectedService(service.id);
                        const bookingSection = document.getElementById('booking');
                        bookingSection.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Запази час
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Booking Section */}
      <section id="booking" className="section booking-section">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="booking-card">
                <Card.Body className="booking-form">
                  <h2 className="form-title">Резервирай своя час</h2>
                  
                  {success && <Alert variant="success">{success}</Alert>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Изберете Услуга *</Form.Label>
                      <Form.Select 
                        value={selectedService} 
                        onChange={(e) => setSelectedService(e.target.value)}
                        required
                      >
                        <option value="">Изберете услуга</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.duration} мин)
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Изберете Дата *</Form.Label>
                      <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        minDate={new Date()}
                        dateFormat="d MMMM, yyyy"
                        className="form-control"
                        placeholderText="Кликнете за избор на дата"
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Изберете Час *</Form.Label>
                      <div className="time-slots-container">
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot, index) => {
                            const isBooked = window.bookedTimeSlots && window.bookedTimeSlots.includes(slot);
                            return (
                              <div
                                key={index}
                                className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                onClick={() => !isBooked && setSelectedTime(slot)}
                              >
                                {slot}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-muted">
                            {loading
                              ? 'Зареждане на свободни часове...'
                              : selectedService && selectedDate
                              ? 'Няма свободни часове за избраната дата'
                              : 'Моля, изберете услуга и дата, за да видите свободните часове'}
                          </p>
                        )}
                      </div>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Вашето Име *</Form.Label>
                          <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Въведете вашето име"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Телефон *</Form.Label>
                          <Form.Control
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Въведете вашия телефон"
                            required
                            isInvalid={!!phoneError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {phoneError}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Съобщение (по желание)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Допълнителна информация"
                      />
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="w-100"
                    >
                      {loading ? 'Обработка...' : 'Резервирай Час'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Gallery Section */}
      <section id="gallery" className="section gallery-section">
        <Container>
          <div className="gallery-heading">
            <h2 className="services-title">Нашата Галерия</h2>
            <p>Разгледайте нашите работи и салон</p>
          </div>
          
          <Row>
            {galleryImages.map((image) => (
              <Col md={4} key={image.id} className="mb-4">
                <Card className="gallery-card">
                  <Card.Img 
                    variant="top" 
                    src={image.file_path.startsWith('http') ? image.file_path : `${API_BASE_URL}${image.file_path}`} 
                    alt={image.title} 
                    className="gallery-image"
                  />
                  {image.title && (
                    <Card.Body>
                      <Card.Title className="h5">{image.title}</Card.Title>
                    </Card.Body>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Testimonials Section */}
      <section className="section testimonials-section">
        <Container>
          <div className="section-heading text-center">
            <h2 className="section-title">Отзиви от Клиенти</h2>
            <div className="barber-stripe"></div>
          </div>
          
          <Row className="mt-5">
            {/* Форма за нов отзив */}
            <Col md={12} className="mb-5">
              <Card className="review-form-card">
                <Card.Body>
                  <h3 className="text-center mb-4">Споделете Вашето Мнение</h3>
                  <Form onSubmit={handleReviewSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Вашето име</Form.Label>
                          <Form.Control
                            type="text"
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            placeholder="Въведете вашето име"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Оценка</Form.Label>
                          <div className="rating-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                onClick={() => setReviewRating(star)}
                                style={{ cursor: 'pointer', color: star <= reviewRating ? '#ffc107' : '#e4e5e9' }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Вашият отзив</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Споделете вашето мнение за нашите услуги"
                        required
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      type="submit"
                      className="w-100"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Изпращане...' : 'Изпрати отзив'}
                    </Button>
                    {reviewSuccess && (
                      <Alert variant="success" className="mt-3">
                        Благодарим за вашия отзив! Той ще бъде публикуван след одобрение.
                      </Alert>
                    )}
                    {reviewError && (
                      <Alert variant="danger" className="mt-3">
                        {reviewError}
                      </Alert>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Съществуващи отзиви */}
            {reviews.map((review) => (
              <Col md={4} key={review.id} className="mb-4">
                <div className="testimonial-card">
                  <div className="testimonial-stars">
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="testimonial-text">"{review.text}"</p>
                  <div className="testimonial-author">- {review.client_name}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <Container>
          <Row>
            <Col lg={5} className="mb-4 mb-lg-0">
              <div className="contact-info">
                <h3 className="contact-title">Контакти</h3>
                <div className="contact-item">
                  <strong>Адрес</strong>
                  <p className="d-flex align-items-center">
                    <FaMapMarkerAlt className="me-2" /> 
                    ж.к. Надежда 3, ул. „Подпоручик Футеков" 1, 1229 София
                  </p>
                </div>
                <div className="contact-item">
                  <strong>Телефон</strong>
                  <p className="d-flex align-items-center">
                    <FaPhoneAlt className="me-2" /> 
                    +359 888 123 456
                  </p>
                </div>
                <div className="contact-item">
                  <strong>Email</strong>
                  <p className="d-flex align-items-center">
                    <FaEnvelope className="me-2" /> 
                    info@barbermaster.bg
                  </p>
                </div>
                <div className="contact-item">
                  <strong>Работно Време</strong>
                  <p className="d-flex align-items-center">
                    <FaClock className="me-2" /> 
                    Понеделник - Петък: 9:00 - 19:00
                  </p>
                  <p className="d-flex align-items-center ps-4">
                    Събота: 10:00 - 16:00
                  </p>
                  <p className="d-flex align-items-center ps-4">
                    Неделя: Затворено
                  </p>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2931.3947269493424!2d23.31598631570661!3d42.73353847916587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40aa8f2aaaaaaaaa%3A0x0!2z0LbQui4g0J3QsNC00LXQttC00LAgMywg0YPQuy4g4oCe0J_QvtC00L_QvtGA0YPRh9C40Log0KTRg9GC0LXQutC-0LLigJwgMSwgMTIyOSDQodC-0YTQuNGP!5e0!3m2!1sbg!2sbg!4v1710371245884!5m2!1sbg!2sbg"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                ></iframe>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <Container>
          <Row>
            <Col lg={4} className="mb-4 mb-lg-0">
              <div className="footer-brand">
                <div className="footer-brand-pole">
                  <div className="pole-stripes"></div>
                </div>
                <span>БръснаряТ</span>
              </div>
              <p className="footer-text">
                Класическа бръснарница с дългогодишни традиции. 
                Професионално подстригване, бръснене и стайлинг за истински джентълмени.
              </p>
              <div className="footer-social">
                <a href="#!" className="social-icon">
                  <FaFacebookF />
                </a>
                <a href="#!" className="social-icon">
                  <FaTwitter />
                </a>
                <a href="#!" className="social-icon">
                  <FaInstagram />
                </a>
                <a href="#!" className="social-icon">
                  <FaLinkedinIn />
                </a>
              </div>
            </Col>
            <Col lg={2} md={6} className="mb-4 mb-lg-0">
              <h4 className="footer-links-title">Услуги</h4>
              <ul className="footer-links">
                <li className="footer-link"><a href="#services"><FaCheck /> Подстригване</a></li>
                <li className="footer-link"><a href="#services"><FaCheck /> Бръснене</a></li>
                <li className="footer-link"><a href="#services"><FaCheck /> Оформяне на брада</a></li>
                <li className="footer-link"><a href="#services"><FaCheck /> VIP Услуги</a></li>
              </ul>
            </Col>
            <Col lg={2} md={6} className="mb-4 mb-lg-0">
              <h4 className="footer-links-title">Бързи връзки</h4>
              <ul className="footer-links">
                <li className="footer-link"><a href="#home"><FaCheck /> Начало</a></li>
                <li className="footer-link"><a href="#services"><FaCheck /> Услуги</a></li>
                <li className="footer-link"><a href="#booking"><FaCheck /> Резервация</a></li>
                <li className="footer-link"><a href="#gallery"><FaCheck /> Галерия</a></li>
                <li className="footer-link"><a href="#contact"><FaCheck /> Контакти</a></li>
              </ul>
            </Col>
            <Col lg={4}>
              <h4 className="footer-links-title">Контакти</h4>
              <ul className="footer-links">
                <li className="footer-link d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2" /> 
                  <span>ж.к. Надежда 3, ул. „Подпоручик Футеков" 1, 1229 София</span>
                </li>
                <li className="footer-link d-flex align-items-center">
                  <FaPhoneAlt className="me-2" /> 
                  <span>+359 888 123 456</span>
                </li>
                <li className="footer-link d-flex align-items-center">
                  <FaEnvelope className="me-2" /> 
                  <span>info@barbermaster.bg</span>
                </li>
              </ul>
            </Col>
          </Row>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} БръснарТ. Всички права запазени.</p>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default HomePage; 