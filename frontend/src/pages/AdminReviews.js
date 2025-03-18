import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge } from 'react-bootstrap';
import { FaCheck, FaTrash, FaStar } from 'react-icons/fa';
import { format } from 'date-fns';
import { getAdminReviews, approveReview, deleteReview } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!isAuthenticated || !isAdmin) {
        navigate('/admin/login');
        return;
      }

      try {
        setLoading(true);
        const response = await getAdminReviews();
        setReviews(response.data.reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to fetch reviews. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isAuthenticated, isAdmin, navigate]);

  const handleApprove = async (reviewId) => {
    try {
      await approveReview(reviewId);
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, is_approved: true } : review
      ));
    } catch (error) {
      console.error('Error approving review:', error);
      setError('Failed to approve review. Please try again.');
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('Failed to delete review. Please try again.');
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Зареждане...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Управление на отзиви</h2>
      
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Клиент</th>
            <th>Оценка</th>
            <th>Отзив</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{format(new Date(review.created_at), 'dd.MM.yyyy HH:mm')}</td>
              <td>{review.client_name}</td>
              <td>
                <div className="d-flex align-items-center">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="text-warning" />
                  ))}
                  <span className="ms-1">({review.rating})</span>
                </div>
              </td>
              <td>{review.text}</td>
              <td>
                <Badge bg={review.is_approved ? 'success' : 'warning'}>
                  {review.is_approved ? 'Одобрен' : 'Чакащ'}
                </Badge>
              </td>
              <td>
                {!review.is_approved && (
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleApprove(review.id)}
                  >
                    <FaCheck /> Одобри
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(review.id)}
                >
                  <FaTrash /> Изтрий
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {reviews.length === 0 && (
        <div className="text-center mt-4">
          <p>Няма намерени отзиви</p>
        </div>
      )}
    </Container>
  );
};

export default AdminReviews; 