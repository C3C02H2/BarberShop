import axios from 'axios';

// Използваме променлива от средата, или API URL, или fallback към localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false as we're using Authorization header
});

// Debug - log all requests
API.interceptors.request.use(request => {
  console.log('Starting Request', {
    url: request.url,
    method: request.method,
    headers: request.headers
  });
  return request;
});

// Debug - log all responses
API.interceptors.response.use(response => {
  console.log('Response:', {
    status: response.status,
    data: response.data,
    headers: response.headers
  });
  return response;
}, error => {
  console.error('Response Error:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    config: error.config
  });
  return Promise.reject(error);
});

// Add a request interceptor to include the auth token in requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Make sure to use the exact format the backend expects
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added token to request', config.url);
    } else {
      console.log('No token available for request', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token issues (401 unauthorized or 422 validation error)
    if ((error.response?.status === 401 || error.response?.status === 422) && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token and redirect to login
      console.log('Authentication error detected, clearing token and redirecting');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (credentials) => {
  try {
    console.log('Making login request with', credentials.username);
    const response = await API.post('/auth/login', credentials);
    console.log('Login response received', response.data);
    
    const { access_token, user, is_admin } = response.data;
    
    if (access_token) {
      console.log('Storing token and setting authorization header');
      localStorage.setItem('token', access_token);
      API.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } else {
      console.warn('No access token received in login response');
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  delete API.defaults.headers.common['Authorization'];
  window.location.href = '/admin/login';
};

export const getCurrentUser = () => API.get('/auth/me/');
export const getMe = () => API.get('/auth/me/');
export const changePassword = (passwords) => API.put('/auth/change-password', passwords);

// Services API
export const getServices = () => API.get('/services/');
export const getService = (id) => API.get(`/services/${id}/`);
export const createService = (data) => API.post('/services/', data);
export const updateService = (id, data) => API.put(`/services/${id}/`, data);
export const deleteService = (id) => API.delete(`/services/${id}/`);

// Appointments API
export const getAppointments = () => API.get('/appointments/');
export const getAppointment = (id) => API.get(`/appointments/${id}/`);
export const createAppointment = (appointment) => API.post('/appointments/', appointment);
export const updateAppointment = (id, appointment) => API.put(`/appointments/${id}/`, appointment);
export const deleteAppointment = (id) => API.delete(`/appointments/${id}/`);
export const getAvailableSlots = (date, serviceId) => 
  API.get(`/appointments/available-slots/?date=${date}&service_id=${serviceId}`);
export const getAppointmentStats = (startDate, endDate) => {
  let url = '/appointments/admin/stats/';
  
  // Добавяме параметри за дата, ако са предоставени
  if (startDate || endDate) {
    url += '?';
    if (startDate) {
      url += `start_date=${startDate}`;
    }
    if (startDate && endDate) {
      url += '&';
    }
    if (endDate) {
      url += `end_date=${endDate}`;
    }
  }
  
  return API.get(url);
};

// Business Hours API
export const getBusinessHours = () => API.get('/appointments/business-hours/');
export const setBusinessHours = (hours) => API.post('/appointments/business-hours/', hours);

// Blocked Dates API
export const getBlockedDates = () => API.get('/appointments/blocked-dates/');
export const addBlockedDate = (date) => API.post('/appointments/blocked-dates/', date);
export const removeBlockedDate = (id) => API.delete(`/appointments/blocked-dates/${id}/`);

// Gallery API
export const getGalleryImages = () => API.get('/gallery/');
export const getGalleryImage = (id) => API.get(`/gallery/${id}/`);
export const uploadGalleryImage = (formData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  return API.post('/gallery/', formData, config);
};
export const updateGalleryImage = (id, formData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  return API.put(`/gallery/${id}/`, formData, config);
};
export const deleteGalleryImage = (id) => API.delete(`/gallery/${id}/`);

// Reviews API
export const createReview = (reviewData) => API.post('/reviews/', reviewData);
export const getReviews = () => API.get('/reviews/');
export const getAdminReviews = async () => {
  try {
    console.log('Fetching admin reviews...');
    const token = localStorage.getItem('token');
    console.log('Current token:', token ? token.substring(0, 10) + '...' : 'no token');
    
    const response = await API.get('/reviews/admin');
    console.log('Admin reviews fetched successfully');
    return response;
  } catch (error) {
    console.error('Error fetching admin reviews:', error.response?.status, error.response?.data);
    throw error;
  }
};
export const approveReview = (reviewId) => API.post(`/reviews/admin/${reviewId}/approve`);
export const deleteReview = (reviewId) => API.delete(`/reviews/admin/${reviewId}`);

// Additional API
export const register = (data) => API.post('/auth/register/', data); 