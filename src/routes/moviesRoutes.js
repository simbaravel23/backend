// backend/src/routes/moviesRoutes.js

const express = require('express');
const { db } = require('../config/database'); // Certifique-se de que este caminho está correto e db é exportado

const router = express.Router();

// 1. Rota para obter o resumo COMPLETO do dashboard
// Esta rota agregará os dados de todas as seções do dashboard em uma única resposta.
// Corresponderá a /api/movies/dashboard-summary
router.get('/dashboard-summary', async (req, res) => {
    try {
        // Obter anos com mais de um vencedor
        const yearsWithMultipleWinners = await new Promise((resolve, reject) => {
            db.find({ winner: true }, (err, docs) => {
                if (err) {
                    console.error('Error fetching yearsWithMultipleWinners for dashboard summary:', err);
                    return reject(err);
                }
                const yearCounts = {};
                docs.forEach(movie => {
                    if (movie.year) {
                        yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
                    }
                });
                const result = Object.keys(yearCounts)
                    .filter(year => yearCounts[year] > 1)
                    .map(year => ({
                        year: parseInt(year),
                        winnerCount: yearCounts[year]
                    }));
                resolve({ years: result });
            });
        });

        // Obter estúdios com mais vitórias
        const studiosWithWinCount = await new Promise((resolve, reject) => {
            db.find({ winner: true }, (err, docs) => {
                if (err) {
                    console.error('Error fetching studiosWithWinCount for dashboard summary:', err);
                    return reject(err);
                }
                const studioCounts = {};
                docs.forEach(movie => {
                    // Garante que movie.studios é uma string e a divide por ',' ou '&'
                    if (movie.studios && typeof movie.studios === 'string') {
                        const studiosArray = movie.studios.split(/, | & /).map(s => s.trim()).filter(s => s);
                        studiosArray.forEach(studio => {
                            studioCounts[studio] = (studioCounts[studio] || 0) + 1;
                        });
                    }
                });
                const sortedStudios = Object.keys(studioCounts)
                    .map(name => ({ name, winCount: studioCounts[name] }))
                    .sort((a, b) => b.winCount - a.winCount);
                resolve({ studios: sortedStudios });
            });
        });

        // Obter produtores com maior e menor intervalo entre vitórias
        const maxMinWinIntervalForProducers = await new Promise((resolve, reject) => {
            db.find({ winner: true }, (err, docs) => {
                if (err) {
                    console.error('Error fetching maxMinWinIntervalForProducers for dashboard summary:', err);
                    return reject(err);
                }
                const producerWins = {};
                docs.forEach(movie => {
                    // Garante que movie.producers é uma string e a divide por ',' ou '&'
                    if (movie.producers && typeof movie.producers === 'string') {
                        const producersArray = movie.producers.split(/, | & /).map(p => p.trim()).filter(p => p);
                        producersArray.forEach(producer => {
                            if (!producerWins[producer]) {
                                producerWins[producer] = [];
                            }
                            producerWins[producer].push(movie.year);
                        });
                    }
                });

                const intervals = [];
                for (const producer in producerWins) {
                    const years = producerWins[producer].sort((a, b) => a - b);
                    if (years.length > 1) {
                        for (let i = 0; i < years.length - 1; i++) {
                            const interval = years[i + 1] - years[i];
                            intervals.push({
                                producer,
                                interval,
                                previousWin: years[i],
                                followingWin: years[i + 1]
                            });
                        }
                    }
                }

                let minInterval = Infinity;
                if (intervals.length > 0) {
                    intervals.forEach(item => {
                        if (item.interval < minInterval) {
                            minInterval = item.interval;
                        }
                    });
                }
                const minProducers = intervals.filter(item => item.interval === minInterval);

                let maxInterval = 0;
                if (intervals.length > 0) {
                    intervals.forEach(item => {
                        if (item.interval > maxInterval) {
                            maxInterval = item.interval;
                        }
                    });
                }
                const maxProducers = intervals.filter(item => item.interval === maxInterval);

                resolve({ min: minProducers, max: maxProducers });
            });
        });

        // Combina todas as respostas em um único objeto para o frontend
        res.json({
            yearsWithMultipleWinners: yearsWithMultipleWinners.years,
            studiosWithWinCount: studiosWithWinCount.studios,
            maxMinWinIntervalForProducers: maxMinWinIntervalForProducers
        });

    } catch (err) {
        console.error('Erro ao obter resumo do dashboard completo:', err);
        res.status(500).json({ error: 'Internal server error ao obter resumo do dashboard.' });
    }
});

// Suas rotas existentes continuam aqui, se necessário para outros propósitos
// No entanto, para o dashboard, a rota acima é a principal.

// 2. Anos com mais de um vencedor (mantida se precisar de acesso individual)
router.get('/yearsWithMultipleWinners', async (req, res) => {
    try {
        db.find({ winner: true }, (err, docs) => {
            if (err) {
                console.error('Error fetching yearsWithMultipleWinners from DB:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const yearCounts = {};
            docs.forEach(movie => {
                if (movie.year) {
                    yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
                }
            });

            const yearsWithMultipleWinners = Object.keys(yearCounts)
                .filter(year => yearCounts[year] > 1)
                .map(year => ({
                    year: parseInt(year),
                    winnerCount: yearCounts[year]
                }));

            res.json({ years: yearsWithMultipleWinners });
        });
    } catch (err) {
        console.error('Error in /yearsWithMultipleWinners:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Três estúdios com mais vitórias (mantida se precisar de acesso individual)
router.get('/studiosWithWinCount', async (req, res) => {
    try {
        db.find({ winner: true }, (err, docs) => {
            if (err) {
                console.error('Error fetching studiosWithWinCount from DB:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const studioCounts = {};
            docs.forEach(movie => {
                if (movie.studios && typeof movie.studios === 'string') {
                    const studiosArray = movie.studios.split(/, | & /).map(s => s.trim()).filter(s => s);
                    studiosArray.forEach(studio => {
                        studioCounts[studio] = (studioCounts[studio] || 0) + 1;
                    });
                }
            });

            const sortedStudios = Object.keys(studioCounts)
                .map(name => ({ name, winCount: studioCounts[name] }))
                .sort((a, b) => b.winCount - a.winCount);

            res.json({ studios: sortedStudios });
        });
    } catch (err) {
        console.error('Error in /studiosWithWinCount:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Produtores com maior e menor intervalo entre vitórias (mantida se precisar de acesso individual)
router.get('/maxMinWinIntervalForProducers', async (req, res) => {
    try {
        db.find({ winner: true }, (err, docs) => {
            if (err) {
                console.error('Error fetching maxMinWinIntervalForProducers from DB:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const producerWins = {};
            docs.forEach(movie => {
                if (movie.producers && typeof movie.producers === 'string') {
                    const producersArray = movie.producers.split(/, | & /).map(p => p.trim()).filter(p => p);
                    producersArray.forEach(producer => {
                        if (!producerWins[producer]) {
                            producerWins[producer] = [];
                        }
                        producerWins[producer].push(movie.year);
                    });
                }
            });

            const intervals = [];
            for (const producer in producerWins) {
                const years = producerWins[producer].sort((a, b) => a - b);
                if (years.length > 1) {
                    for (let i = 0; i < years.length - 1; i++) {
                        const interval = years[i + 1] - years[i];
                        intervals.push({
                            producer,
                            interval,
                            previousWin: years[i],
                            followingWin: years[i + 1]
                        });
                    }
                }
            }

            let minInterval = Infinity;
            if (intervals.length > 0) {
                intervals.forEach(item => {
                    if (item.interval < minInterval) {
                        minInterval = item.interval;
                    }
                });
            }
            const minProducers = intervals.filter(item => item.interval === minInterval);

            let maxInterval = 0;
            if (intervals.length > 0) {
                intervals.forEach(item => {
                    if (item.interval > maxInterval) {
                        maxInterval = item.interval;
                    }
                });
            }
            const maxProducers = intervals.filter(item => item.interval === maxInterval);

            res.json({ min: minProducers, max: maxProducers });
        });
    } catch (err) {
        console.error('Error in /maxMinWinIntervalForProducers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Vencedores de determinado ano
router.get('/winnersByYear', async (req, res) => {
    const year = parseInt(req.query.year, 10);
    if (isNaN(year)) {
        return res.status(400).json({ error: 'Ano inválido fornecido.' });
    }

    try {
        db.find({ year: year, winner: true }, (err, docs) => {
            if (err) {
                console.error('Error fetching winnersByYear from DB:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(docs);
        });
    } catch (err) {
        console.error('Error in /winnersByYear:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. Rota para obter todos os filmes (para a tela de Lista de Filmes)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page || 0);
    const size = parseInt(req.query.size || 10);
    const yearFilter = req.query.year ? parseInt(req.query.year) : undefined;
    const winnerFilter = req.query.winner; // 'yes', 'no', ou undefined

    const query = {};
    if (yearFilter) {
        query.year = yearFilter;
    }
    if (winnerFilter !== undefined && winnerFilter !== '') {
        query.winner = winnerFilter === 'yes';
    }

    try {
        db.count(query, (err, count) => {
            if (err) {
                console.error('Error counting movies:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            db.find(query)
                .skip(page * size)
                .limit(size)
                .exec((err, docs) => {
                    if (err) {
                        console.error('Error fetching all movies:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    const response = {
                        content: docs,
                        pageable: {
                            pageNumber: page,
                            pageSize: size,
                        },
                        totalPages: Math.ceil(count / size),
                        totalElements: count,
                        last: (page * size + docs.length) >= count,
                        first: page === 0,
                        number: page,
                        numberOfElements: docs.length,
                        size: size
                    };

                    res.json(response);
                });
        });
    } catch (err) {
        console.error('Error in /api/movies:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
