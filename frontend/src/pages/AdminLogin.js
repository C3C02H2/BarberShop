import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const auth = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to admin dashboard
    if (auth && auth.isAuthenticated && auth.isAdmin) {
      navigate('/admin');
    }
  }, [auth, auth?.isAuthenticated, auth?.isAdmin, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { username });
    setLocalError('');
    
    if (!username || !password) {
      setLocalError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    try {
      const result = await auth.login({ username, password });
      console.log('Login result:', result);
      
      if (result && result.success) {
        console.log('Login successful, redirecting to /admin');
        navigate('/admin');
      } else {
        // Set error message from result if available
        setLocalError(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setLocalError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2>Admin Login</h2>
                <p className="text-muted">Enter your credentials to access the admin panel</p>
              </div>
              
              {(auth?.error || localError) && (
                <Alert variant="danger">
                  {auth?.error || localError}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-4 text-center">
                <a href="/" className="text-decoration-none">
                  &larr; Back to main site
                </a>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminLogin; 