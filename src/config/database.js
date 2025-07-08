// backend/src/config/Database.js
const Datastore = require('nedb');
const path = require('path');

// Define o caminho para o arquivo do banco de dados NeDB
// Ele será salvo em 'backend/data/movies.db'
const dbPath = path.join(__dirname, '../../data/movies.db');

// Inicializa o banco de dados NeDB
// autoload: true faz com que o banco de dados seja carregado do arquivo automaticamente
const db = new Datastore({ filename: dbPath, autoload: true });

// Função para inicializar o banco de dados (garantir índices, etc.)
const InitDb = () => {
  console.log('Database Initialized (in-memory).'); // Este log é do Database.js

  // Garante que o índice 'year' existe para otimizar buscas
  db.ensureIndex({ fieldName: 'year', unique: false }, (err) => {
    if (err) {
      console.error('Error creating index on "year":', err);
    } else {
      console.log('Index on "year" ensured.');
    }
  });
};

// Exporta as instâncias 'db' e a função 'InitDb'
module.exports = { db, InitDb };
