// backend/src/routes/moviesRoutes.js
const express = require('express');
const { db } = require('../config/database'); // Certifique-se de que este caminho está correto e db é exportado

const router = express.Router();

// Helper para obter dados (temporário, para simular o DB)
// Substitua isso pela sua lógica real do banco de dados NeDB
const getMockData = async () => {
    return new Promise(resolve => {
        db.find({}, (err, docs) => {
            if (err) {
                console.error("Error fetching data from DB:", err);
                resolve([]);
            } else {
                resolve(docs);
            }
        });
    });
};


// 1. Anos com mais de um vencedor
router.get('/yearsWithMultipleWinners', async (req, res) => {
  try {
    // Implemente a lógica real de consulta ao banco de dados aqui
    // Exemplo para NeDB (assumindo que 'db' é sua instância de NeDB)
    db.find({ winner: true }, (err, docs) => {
      if (err) {
        console.error('Error fetching yearsWithMultipleWinners from DB:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Agrupa por ano e conta vencedores, então filtra os com mais de um
      const yearCounts = {};
      docs.forEach(movie => {
        if (movie.year) { // Certifica-se de que o ano existe
            yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
        }
      });

      const yearsWithMultipleWinners = Object.keys(yearCounts)
        .filter(year => yearCounts[year] > 1)
        .map(year => ({
          year: parseInt(year),
          winnerCount: yearCounts[year]
        }));

      res.json({ years: yearsWithMultipleWinners }); //
    });
  } catch (err) {
    console.error('Error in /yearsWithMultipleWinners:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 2. Três estúdios com mais vitórias
router.get('/studiosWithWinCount', async (req, res) => {
  try {
    db.find({ winner: true }, (err, docs) => {
      if (err) {
        console.error('Error fetching studiosWithWinCount from DB:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const studioCounts = {};
      docs.forEach(movie => {
        if (movie.studios && Array.isArray(movie.studios)) {
          movie.studios.forEach(studio => {
            studioCounts[studio.trim()] = (studioCounts[studio.trim()] || 0) + 1;
          });
        }
      });

      const sortedStudios = Object.keys(studioCounts)
        .map(name => ({ name, winCount: studioCounts[name] }))
        .sort((a, b) => b.winCount - a.winCount);

      res.json({ studios: sortedStudios }); //
    });
  } catch (err) {
    console.error('Error in /studiosWithWinCount:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 3. Produtores com maior e menor intervalo entre vitórias
router.get('/maxMinWinIntervalForProducers', async (req, res) => {
  try {
    db.find({ winner: true }, (err, docs) => {
      if (err) {
        console.error('Error fetching maxMinWinIntervalForProducers from DB:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const producerWins = {};
      docs.forEach(movie => {
        if (movie.producers && Array.isArray(movie.producers)) {
          movie.producers.forEach(producer => {
            const pName = producer.trim();
            if (!producerWins[pName]) {
              producerWins[pName] = [];
            }
            producerWins[pName].push(movie.year);
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

      // Encontrar o menor intervalo
      let minInterval = Infinity;
      intervals.forEach(item => {
        if (item.interval < minInterval) {
          minInterval = item.interval;
        }
      });
      const minProducers = intervals.filter(item => item.interval === minInterval);

      // Encontrar o maior intervalo
      let maxInterval = 0;
      intervals.forEach(item => {
        if (item.interval > maxInterval) {
          maxInterval = item.interval;
        }
      });
      const maxProducers = intervals.filter(item => item.interval === maxInterval);

      // Formato esperado: { min: [], max: [] }
      res.json({ min: minProducers, max: maxProducers });
    });
  } catch (err) {
    console.error('Error in /maxMinWinIntervalForProducers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 4. Vencedores de determinado ano
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
      // O formato esperado para /winnersByYear é uma lista de filmes
      res.json(docs);
    });
  } catch (err) {
    console.error('Error in /winnersByYear:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para obter todos os filmes (para a tela de Lista de Filmes)
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

                // Adapte para o formato de paginação da avaliação
                const response = {
                    content: docs,
                    pageable: {
                        pageNumber: page,
                        pageSize: size,
                        // Outros campos de pageable conforme a avaliação, se aplicável
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