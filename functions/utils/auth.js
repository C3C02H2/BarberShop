const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { client, q } = require('./db');
require('dotenv').config();

// JWT секретен ключ
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';

// Генериране на JWT токен
const generateToken = (userId) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Проверка на JWT токен
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Извличане на токен от Authorization header
const getTokenFromHeader = (headers) => {
  const authHeader = headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Проверка дали потребителят е администратор
const isAdmin = async (userId) => {
  try {
    const user = await client.query(
      q.Get(q.Ref(q.Collection('users'), userId))
    );
    return user.data.role === 'admin';
  } catch {
    return false;
  }
};

// Middleware за защита на endpoint-и
const requireAuth = async (headers) => {
  const token = getTokenFromHeader(headers);
  if (!token) {
    return { 
      error: true, 
      status: 401, 
      message: 'Липсва токен за автентикация' 
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { 
      error: true, 
      status: 401, 
      message: 'Невалиден или изтекъл токен' 
    };
  }

  return { 
    error: false, 
    userId: decoded.sub 
  };
};

// Middleware за проверка на admin права
const requireAdmin = async (headers) => {
  const authResult = await requireAuth(headers);
  
  if (authResult.error) {
    return authResult;
  }
  
  const adminCheck = await isAdmin(authResult.userId);
  if (!adminCheck) {
    return { 
      error: true, 
      status: 403, 
      message: 'Необходими са административни права' 
    };
  }
  
  return { 
    error: false, 
    userId: authResult.userId 
  };
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader,
  requireAuth,
  requireAdmin,
  isAdmin
}; 