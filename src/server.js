const cors = require('cors');
const app = express();

const allowedOrigins = [
    'http://localhost:5173', // Permite o seu frontend local
    'https://listafilme.onrender.com' // A URL do seu próprio backend na Render
    // Adicione a URL do seu frontend na Render AQUI quando souber (ex: 'https://seu-frontend.onrender.com')
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}));

// Use o middleware para JSON
app.use(express.json());

// 5. Defina as rotas (estas devem vir depois dos middlewares de CORS e JSON)
app.use('/api/movies', moviesRoutes); // Adicione suas rotas de filmes aqui
app.use('/api/producers', producersRoutes); // Se você tiver rotas de producers, adicione aqui

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('API is running!');
});

// Certifique-se de importar InitDb
const { InitDb } = require('./config/Database'); // Ajuste o caminho se necessário
const dataService = require('./services/dataService'); // Ajuste o caminho se necessário

// Inicializa o banco de dados e carrega o CSV
async function initApplication() { // Renomeado para evitar confusão com InitDb do Database.js
    try {
        await InitDb(); // Chame InitDb primeiro para inicializar o banco de dados
        console.log('Database Initialized (in-memory).');

        await dataService.loadMoviesFromCsv(); // Carregue o CSV depois que o DB estiver pronto
        console.log('CSV data loaded into database.');

    } catch (err) {
        console.error('Error during application initialization (DB or CSV load):', err);
        process.exit(1); // Saia se houver um erro crítico
    }
}

// 6. Inicie a aplicação APÓS a inicialização do DB e carga do CSV
initApplication().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server due to initialization error:", err);
    process.exit(1);
});