// backend/src/server.js

// 1. Importações necessárias no topo do arquivo
const express = require('express');
const cors = require('cors');
const app = express(); // Inicializa o aplicativo Express
const moviesRoutes = require('./routes/moviesRoutes'); // Importa as rotas de filmes

// Se você tiver rotas de produtores, importe-as também:
// const producersRoutes = require('./routes/producersRoutes');

// Importa a função InitDb do Database.js e loadMoviesFromCsv do dataService.js
// ATENÇÃO: Certifique-se de que 'InitDb' é uma função exportada corretamente de './config/database.js'
const { InitDb } = require('./config/database.js');
const dataService = require('./services/dataService.js'); // Certifique-se que o caminho está correto

// Adicione esta linha para depuração:
console.log('Tipo de InitDb após importação:', typeof InitDb);

// Define as origens permitidas para o CORS
const allowedOrigins = [
    'http://localhost:5173', // Para desenvolvimento local
    'https://listafilme.onrender.com', // A URL do seu próprio backend na Render
    'https://listadefilmes-adtf.onrender.com' // << ADICIONE ESTA LINHA COM A URL REAL DO SEU FRONTEND
];

// 2. Configuração do middleware CORS (APENAS UMA VEZ)
app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: de ferramentas como Postman, ou se a mesma origem Render)
        if (!origin) return callback(null, true);
        // Verifica se a origem da requisição está na lista de origens permitidas
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política CORS para este site não permite acesso da Origem especificada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Permite o envio de credenciais (cookies, headers de autorização)
    optionsSuccessStatus: 204 // Status de sucesso para requisições OPTIONS (preflight)
}));

// 3. Outros middlewares (sempre após o CORS, se o CORS for global)
app.use(express.json()); // Middleware para parsear corpos de requisição JSON

// 4. Definição das rotas da API
app.use('/api/movies', moviesRoutes); // Usa as rotas de filmes sob o prefixo /api/movies

// Se você tiver rotas de produtores, adicione-as aqui:
// app.use('/api/producers', producersRoutes);

// Rota de teste simples para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('API está funcionando!');
});

// 5. Função para inicializar a aplicação (DB e carregar CSV)
async function initApplication() {
    try {
        // Verifica se InitDb é realmente uma função antes de tentar chamá-la
        if (typeof InitDb === 'function') {
            await InitDb(); // Esta é a linha que estava dando erro
            console.log('Banco de Dados Inicializado (em memória).');
        } else {
            console.error('Erro: InitDb não é uma função. Verifique a exportação em database.js');
            process.exit(1); // Encerra se a função InitDb não estiver disponível
        }

        // Carrega os filmes do CSV para o banco de dados
        await dataService.loadMoviesFromCsv();
        console.log('Dados CSV carregados no banco de dados.');

    } catch (err) {
        console.error('Erro durante a inicialização da aplicação (DB ou carga CSV):', err);
        // Em caso de erro crítico na inicialização, encerra o processo
        process.exit(1);
    }
}

// 6. Inicia a aplicação APÓS a inicialização do DB e carga do CSV
// Define a porta do servidor, usando a variável de ambiente PORT (para Render) ou 3000 como fallback
const PORT = process.env.PORT || 3000;

initApplication().then(() => {
    // Inicia o servidor Express após a inicialização bem-sucedida
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Falha ao iniciar o servidor devido a um erro de inicialização:", err);
    process.exit(1); // Encerra se não conseguir iniciar o servidor
});
