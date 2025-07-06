// Importe o pacote cors no topo do arquivo, junto com 'express'
const express = require('express');
const cors = require('cors'); // <--- Adicione esta linha
const { loadMoviesFromCsv } = require('./services/dataService');
const producersRoutes = require('./routes/producersRoutes'); // Se você tiver rotas específicas, como esta
const moviesRoutes = require('./routes/moviesRoutes'); // Assumindo que você terá um arquivo para as rotas de filmes

const app = express();
const PORT = process.env.PORT || 3000;

// Use o middleware CORS ANTES de definir suas rotas
app.use(cors()); // <--- Adicione esta linha (permite todas as origens por padrão, o que é bom para desenvolvimento)

// Se você precisar ser mais específico, pode configurar o CORS assim:
// app.use(cors({
//   origin: 'http://localhost:5173', // Permite apenas requisições desta origem
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true, // Se você estiver usando cookies ou headers de autorização
// }));


app.use(express.json()); // Para parsear corpos de requisição JSON

// Defina suas rotas
app.use('/api/movies', moviesRoutes); // Exemplo de uso de rotas de filmes
app.use('/api/producers', producersRoutes); // Exemplo de uso de rotas de produtores

// Inicializa o banco de dados e carrega o CSV
async function initDb() {
  await loadMoviesFromCsv();
}

initDb();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});