// src/server.js
const app = require('./app');
const { initDb } = require('./config/database');
const { loadMoviesFromCsv } = require('./services/dataService'); // Caminho corrigido

const PORT = process.env.PORT || 3000; // Porta padrão 3000

// Inicia o banco de dados e carrega os filmes do CSV ao iniciar o servidor
initDb();
loadMoviesFromCsv();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});