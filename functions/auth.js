const { client, q, createRecord } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const bcrypt = require('bcryptjs');

// Обработка на входни данни и отговори
const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

// Помощна функция за обработка на OPTIONS заявки (CORS preflight)
const handleOptions = () => {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: ''
  };
};

// Функция за вход
const login = async (username, password) => {
  try {
    // Намиране на потребител по потребителско име
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('users_by_username'), username)
        ),
        q.Lambda('user', q.Get(q.Var('user')))
      )
    );

    if (result.data.length === 0) {
      return createResponse(401, { error: 'Невалидно потребителско име или парола' });
    }

    const user = result.data[0];
    const isPasswordValid = await bcrypt.compare(password, user.data.password);

    if (!isPasswordValid) {
      return createResponse(401, { error: 'Невалидно потребителско име или парола' });
    }

    // Генериране на JWT токен
    const token = generateToken(user.ref.id);
    
    return createResponse(200, { 
      token,
      user: {
        id: user.ref.id,
        username: user.data.username,
        role: user.data.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return createResponse(500, { error: 'Възникна грешка при влизане' });
  }
};

// Функция за създаване на администраторски акаунт ако няма
const createAdminIfNotExists = async () => {
  try {
    // Проверка дали вече има админ акаунт
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('users_by_username'), 'admin')
        ),
        q.Lambda('user', q.Get(q.Var('user')))
      )
    );

    if (result.data.length === 0) {
      // Хеширане на паролата
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      // Създаване на админ потребител
      await createRecord('users', {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

exports.handler = async (event, context) => {
  // Обработка на OPTIONS заявки
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Обработка на POST заявки за път /api/auth/login
  if (event.httpMethod === 'POST' && event.path.endsWith('/api/auth/login')) {
    try {
      const { username, password } = JSON.parse(event.body);
      
      // Проверка за задължителни полета
      if (!username || !password) {
        return createResponse(400, { 
          error: 'Потребителското име и паролата са задължителни' 
        });
      }
      
      // Извикване на функцията за автентикация
      return await login(username, password);
    } catch (error) {
      console.error('Error in login handler:', error);
      return createResponse(500, { 
        error: 'Грешка при обработка на заявката' 
      });
    }
  }

  // Ако нито едно от горните условия не е изпълнено
  return createResponse(404, { error: 'Невалиден API endpoint' });
}; 