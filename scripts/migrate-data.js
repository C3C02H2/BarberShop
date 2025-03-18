const { Client } = require('pg');
const faunadb = require('faunadb');
const q = faunadb.query;
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Конфигурация за PostgreSQL
const pgConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1@192.168.0.220:5433/postgres',
};

// Конфигурация за FaunaDB
const faunaClient = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY,
});

// Функция за миграция на потребители
const migrateUsers = async (pgClient) => {
  console.log('Мигриране на потребители...');
  
  try {
    // Извличане на потребители от PostgreSQL
    const { rows: users } = await pgClient.query('SELECT * FROM users');
    
    // Добавяне на всеки потребител във FaunaDB
    for (const user of users) {
      // Генериране на нова хеширана парола (ако е необходимо)
      // PostgreSQL и FaunaDB може да използват различни методи за хеширане
      const passwordHash = await bcrypt.hash(user.password_hash.replace(/^pbkdf2:sha256:/, ''), 10);
      
      try {
        await faunaClient.query(
          q.Create(
            q.Collection('users'),
            {
              data: {
                username: user.username,
                password: passwordHash,
                role: user.is_admin ? 'admin' : 'user',
                createdAt: new Date(user.created_at || Date.now()).toISOString()
              }
            }
          )
        );
        console.log(`Потребителят ${user.username} е мигриран успешно`);
      } catch (error) {
        if (error.description && error.description.includes('document is not unique')) {
          console.log(`Потребителят ${user.username} вече съществува`);
        } else {
          console.error(`Грешка при мигриране на потребител ${user.username}:`, error);
        }
      }
    }
    
    console.log(`Мигрирани ${users.length} потребители`);
  } catch (error) {
    console.error('Грешка при мигриране на потребители:', error);
  }
};

// Функция за миграция на услуги
const migrateServices = async (pgClient) => {
  console.log('Мигриране на услуги...');
  
  try {
    // Извличане на услуги от PostgreSQL
    const { rows: services } = await pgClient.query('SELECT * FROM services');
    
    // Добавяне на всяка услуга във FaunaDB
    for (const service of services) {
      try {
        await faunaClient.query(
          q.Create(
            q.Collection('services'),
            {
              data: {
                name: service.name,
                description: service.description || '',
                duration: service.duration,
                price: service.price || 0,
                imageUrl: service.image_url || '',
                createdAt: new Date(service.created_at || Date.now()).toISOString()
              }
            }
          )
        );
        console.log(`Услугата ${service.name} е мигрирана успешно`);
      } catch (error) {
        if (error.description && error.description.includes('document is not unique')) {
          console.log(`Услугата ${service.name} вече съществува`);
        } else {
          console.error(`Грешка при мигриране на услуга ${service.name}:`, error);
        }
      }
    }
    
    console.log(`Мигрирани ${services.length} услуги`);
  } catch (error) {
    console.error('Грешка при мигриране на услуги:', error);
  }
};

// Функция за миграция на резервации
const migrateAppointments = async (pgClient) => {
  console.log('Мигриране на резервации...');
  
  try {
    // Извличане на резервации от PostgreSQL
    const { rows: appointments } = await pgClient.query('SELECT * FROM appointments');
    
    // Добавяне на всяка резервация във FaunaDB
    for (const appointment of appointments) {
      try {
        await faunaClient.query(
          q.Create(
            q.Collection('appointments'),
            {
              data: {
                date: new Date(appointment.date).toISOString().split('T')[0],
                time: appointment.time,
                clientName: appointment.client_name,
                email: appointment.email,
                phone: appointment.phone,
                serviceId: appointment.service_id.toString(),
                status: appointment.status || 'pending',
                notes: appointment.notes || '',
                createdAt: new Date(appointment.created_at || Date.now()).toISOString()
              }
            }
          )
        );
        console.log(`Резервацията за ${appointment.client_name} на ${appointment.date} е мигрирана успешно`);
      } catch (error) {
        console.error(`Грешка при мигриране на резервация:`, error);
      }
    }
    
    console.log(`Мигрирани ${appointments.length} резервации`);
  } catch (error) {
    console.error('Грешка при мигриране на резервации:', error);
  }
};

// Функция за миграция на галерия
const migrateGallery = async (pgClient) => {
  console.log('Мигриране на галерия...');
  
  try {
    // Извличане на галерия от PostgreSQL
    const { rows: images } = await pgClient.query('SELECT * FROM gallery');
    
    // Добавяне на всяко изображение във FaunaDB
    for (const image of images) {
      try {
        await faunaClient.query(
          q.Create(
            q.Collection('gallery'),
            {
              data: {
                title: image.title || '',
                description: image.description || '',
                imageUrl: image.image_url,
                order: image.display_order || 0,
                createdAt: new Date(image.created_at || Date.now()).toISOString()
              }
            }
          )
        );
        console.log(`Изображението ${image.title || image.image_url} е мигрирано успешно`);
      } catch (error) {
        console.error(`Грешка при мигриране на изображение:`, error);
      }
    }
    
    console.log(`Мигрирани ${images.length} изображения`);
  } catch (error) {
    console.error('Грешка при мигриране на галерия:', error);
  }
};

// Главна функция за миграция
const migrateData = async () => {
  const pgClient = new Client(pgConfig);
  
  try {
    console.log('Стартиране на миграцията на данни...');
    
    // Свързване с PostgreSQL
    await pgClient.connect();
    console.log('Свързан с PostgreSQL');
    
    // Миграция на всички данни
    await migrateUsers(pgClient);
    await migrateServices(pgClient);
    await migrateAppointments(pgClient);
    await migrateGallery(pgClient);
    
    console.log('Миграцията на данни приключи успешно!');
  } catch (error) {
    console.error('Грешка при миграция на данни:', error);
  } finally {
    // Прекъсване на връзката с PostgreSQL
    await pgClient.end();
    console.log('Връзката с PostgreSQL е прекъсната');
  }
};

// Изпълнение на функцията за миграция
migrateData().catch(console.error); 