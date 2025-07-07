// backend/src/server.js

// 1. Importe o express e o cors no topo
const express = require('express');
const cors = require('cors');

// 2. Importe os serviços e as rotas
const { loadMoviesFromCsv } = require('./services/dataService');
// Importe as rotas que você está usando. Ajuste o caminho se necessário.
const moviesRoutes = require('./routes/moviesRoutes'); 

// 3. Crie a instância do aplicativo Express
const app = express(); // <--- VERIFIQUE SE ESTA LINHA ESTÁ PRESENTE E CORRETA
const PORT = process.env.PORT || 3000;

const frontendUrl = 'https://listafilme.onrender.com'; // Exemplo

const corsOptions = {
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204 
  };
// 4. Use os middlewares
app.use(cors()); // Middleware CORS
app.use(express.json()); // Middleware para JSON

// 5. Defina as rotas
app.use('/api/movies', moviesRoutes); // Adicione suas rotas de filmes aqui

// Rota de teste simples
app.get('/', (req, res) => {
  res.send('API is running!');
});

// Inicializa o banco de dados e carrega o CSV
async function initDb() {
  try {
    await loadMoviesFromCsv();
    console.log('Database initialized and CSV loaded.');
  } catch (err) {
    console.error('Error during database initialization or CSV load:', err);
    // Você pode querer sair do processo ou desabilitar funcionalidades se o DB não carregar
  }
}

// 6. Inicie a aplicação APÓS a inicialização do DB
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server due to DB initialization error:", err);
  process.exit(1); // Opcional: sai se o DB não puder ser inicializado
});