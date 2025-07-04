// src/app.js
const express = require('express');
const dotenv = require('dotenv');
const { initDb } = require('./config/database');
const { loadMoviesFromCsv } = require('./services/dataService');
const producersRoutes = require('./routes/producersRoutes');

dotenv.config(); // Carrega variáveis de ambiente

const app = express();

app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// Rota de saúde simples
app.get('/', (req, res) => {
    res.send('Golden Raspberry Awards Backend API is running!');
});

// Use as rotas da API
app.use('/api/producers', producersRoutes);

module.exports = app;