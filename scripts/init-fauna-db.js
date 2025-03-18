const faunadb = require('faunadb');
const q = faunadb.query;
require('dotenv').config();

const FAUNA_SECRET_KEY = process.env.FAUNA_SECRET_KEY;

if (!FAUNA_SECRET_KEY) {
  console.error('No FAUNA_SECRET_KEY found in environment variables');
  process.exit(1);
}

// Инициализиране на клиента за Fauna DB
const client = new faunadb.Client({
  secret: FAUNA_SECRET_KEY,
});

// Асинхронна функция за създаване на колекция
const createCollection = async (name) => {
  try {
    await client.query(
      q.CreateCollection({ name })
    );
    console.log(`Collection '${name}' created successfully`);
  } catch (error) {
    if (error.description === 'Collection already exists.') {
      console.log(`Collection '${name}' already exists`);
    } else {
      console.error(`Error creating collection '${name}':`, error);
    }
  }
};

// Асинхронна функция за създаване на индекс
const createIndex = async (name, collection, terms, values) => {
  try {
    const indexData = {
      name,
      source: q.Collection(collection),
      terms: terms ? [{ field: terms }] : undefined,
      values: values ? [{ field: values }] : undefined,
    };
    
    // Премахване на недефинирани полета
    Object.keys(indexData).forEach(key => 
      indexData[key] === undefined && delete indexData[key]
    );
    
    await client.query(
      q.CreateIndex(indexData)
    );
    console.log(`Index '${name}' created successfully`);
  } catch (error) {
    if (error.description === 'Index already exists.') {
      console.log(`Index '${name}' already exists`);
    } else {
      console.error(`Error creating index '${name}':`, error);
    }
  }
};

// Главна функция за инициализиране на базата данни
const initializeDatabase = async () => {
  try {
    console.log('Initializing FaunaDB database...');
    
    // Създаване на колекции
    await createCollection('users');
    await createCollection('services');
    await createCollection('appointments');
    await createCollection('gallery');
    await createCollection('reviews');
    await createCollection('business_hours');
    await createCollection('blocked_dates');
    
    // Създаване на индекси
    await createIndex('users_by_username', 'users', ['data', 'username']);
    await createIndex('appointments_by_date', 'appointments', ['data', 'date']);
    await createIndex('appointments_by_email', 'appointments', ['data', 'email']);
    await createIndex('services_by_name', 'services', ['data', 'name']);
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
};

// Изпълнение на функцията за инициализиране
initializeDatabase()
  .then(() => {
    console.log('Database setup completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database setup failed:', error);
    process.exit(1);
  }); 