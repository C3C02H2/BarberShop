const { client, q, createRecord, getAllRecords, getRecord, updateRecord, deleteRecord } = require('./utils/db');
const { requireAdmin, requireAuth } = require('./utils/auth');

// Обработка на входни данни и отговори
const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: ''
  };
};

// Получаване на всички услуги
const getServices = async () => {
  try {
    const result = await getAllRecords('services');
    
    // Мапиране на данните за клиента
    const services = result.data.map(service => ({
      id: service.ref.id,
      name: service.data.name,
      description: service.data.description,
      duration: service.data.duration,
      price: service.data.price,
      imageUrl: service.data.imageUrl
    }));
    
    return createResponse(200, { services });
  } catch (error) {
    console.error('Error getting services:', error);
    return createResponse(500, { error: 'Възникна грешка при извличане на услугите' });
  }
};

// Добавяне на нова услуга
const createService = async (event) => {
  try {
    // Проверка за админ права
    const authResult = await requireAdmin(event.headers);
    if (authResult.error) {
      return createResponse(authResult.status, { error: authResult.message });
    }
    
    const { name, description, duration, price, imageUrl } = JSON.parse(event.body);
    
    // Валидация на входните данни
    if (!name || !duration) {
      return createResponse(400, { error: 'Името и продължителността са задължителни полета' });
    }
    
    // Създаване на услуга
    const service = await createRecord('services', {
      name,
      description: description || '',
      duration: parseInt(duration),
      price: price || 0,
      imageUrl: imageUrl || '',
      createdAt: new Date().toISOString()
    });
    
    return createResponse(201, { 
      message: 'Услугата е създадена успешно', 
      service: {
        id: service.ref.id,
        name: service.data.name,
        description: service.data.description,
        duration: service.data.duration,
        price: service.data.price,
        imageUrl: service.data.imageUrl
      }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return createResponse(500, { error: 'Възникна грешка при създаване на услугата' });
  }
};

// Обновяване на услуга
const updateService = async (event) => {
  try {
    // Проверка за админ права
    const authResult = await requireAdmin(event.headers);
    if (authResult.error) {
      return createResponse(authResult.status, { error: authResult.message });
    }
    
    // Извличане на ID от пътя
    const id = event.path.split('/').pop();
    
    const { name, description, duration, price, imageUrl } = JSON.parse(event.body);
    
    // Валидация на входните данни
    if (!name || !duration) {
      return createResponse(400, { error: 'Името и продължителността са задължителни полета' });
    }
    
    // Обновяване на услуга
    const service = await updateRecord('services', id, {
      name,
      description: description || '',
      duration: parseInt(duration),
      price: price || 0,
      imageUrl: imageUrl || '',
      updatedAt: new Date().toISOString()
    });
    
    return createResponse(200, { 
      message: 'Услугата е обновена успешно',
      service: {
        id: service.ref.id,
        name: service.data.name,
        description: service.data.description,
        duration: service.data.duration,
        price: service.data.price,
        imageUrl: service.data.imageUrl
      }
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return createResponse(500, { error: 'Възникна грешка при обновяване на услугата' });
  }
};

// Изтриване на услуга
const deleteService = async (event) => {
  try {
    // Проверка за админ права
    const authResult = await requireAdmin(event.headers);
    if (authResult.error) {
      return createResponse(authResult.status, { error: authResult.message });
    }
    
    // Извличане на ID от пътя
    const id = event.path.split('/').pop();
    
    // Изтриване на услуга
    await deleteRecord('services', id);
    
    return createResponse(200, { message: 'Услугата е изтрита успешно' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return createResponse(500, { error: 'Възникна грешка при изтриване на услугата' });
  }
};

exports.handler = async (event, context) => {
  // Обработка на OPTIONS заявки
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // GET /api/services - Извличане на всички услуги
  if (event.httpMethod === 'GET' && event.path === '/api/services') {
    return await getServices();
  }

  // POST /api/services - Създаване на нова услуга
  if (event.httpMethod === 'POST' && event.path === '/api/services') {
    return await createService(event);
  }

  // PUT /api/services/{id} - Обновяване на услуга
  if (event.httpMethod === 'PUT' && event.path.match(/\/api\/services\/[^\/]+$/)) {
    return await updateService(event);
  }

  // DELETE /api/services/{id} - Изтриване на услуга
  if (event.httpMethod === 'DELETE' && event.path.match(/\/api\/services\/[^\/]+$/)) {
    return await deleteService(event);
  }

  // Ако нито едно от горните условия не е изпълнено
  return createResponse(404, { error: 'Невалиден API endpoint' });
}; 