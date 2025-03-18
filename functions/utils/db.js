const faunadb = require('faunadb');
const q = faunadb.query;
require('dotenv').config();

// Инициализирам клиента за Fauna DB
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY,
});

// Общи функции за достъп до базата данни
const createRecord = async (collection, data) => {
  return await client.query(
    q.Create(
      q.Collection(collection),
      { data }
    )
  );
};

const getRecord = async (collection, id) => {
  return await client.query(
    q.Get(
      q.Ref(q.Collection(collection), id)
    )
  );
};

const getAllRecords = async (collection) => {
  return await client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection(collection)), { size: 100 }),
      q.Lambda('ref', q.Get(q.Var('ref')))
    )
  );
};

const updateRecord = async (collection, id, data) => {
  return await client.query(
    q.Update(
      q.Ref(q.Collection(collection), id),
      { data }
    )
  );
};

const deleteRecord = async (collection, id) => {
  return await client.query(
    q.Delete(
      q.Ref(q.Collection(collection), id)
    )
  );
};

// Експортирам FaunaDB клиента и помощни функции
module.exports = {
  client,
  q,
  createRecord,
  getRecord,
  getAllRecords,
  updateRecord,
  deleteRecord
}; 