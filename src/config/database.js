// src/config/database.js
const Datastore = require('nedb');
const path = require('path');

// Configura o banco de dados para ser completamente em memória.
// Se você quisesse persistir em arquivo, o construtor seria:
// new Datastore({ filename: path.join(__dirname, '../../data/movies.db'), autoload: true });
const db = new Datastore(); // Apenas em memória

const initDb = () => {
    console.log('Database initialized (in-memory).');
    // Você pode adicionar um índice se quiser otimizar buscas
    db.ensureIndex({ fieldName: 'year' }, function (err) {
        if (err) console.error("Error creating index on 'year':", err);
    });
};

module.exports = { db, initDb };