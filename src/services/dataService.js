// src/services/dataService.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { db } = require('../config/database');

const CSV_FILE_PATH = path.join(__dirname, '../../data/movielist.csv'); // Supondo um CSV com a lista de filmes

// Função para carregar os dados do CSV para o NeDB
const loadMoviesFromCsv = () => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found at: ${CSV_FILE_PATH}`);
        return;
    }

    const movies = [];
    fs.createReadStream(CSV_FILE_PATH)
        .pipe(parse({
            columns: true, // Assumindo que a primeira linha do CSV são os cabeçalhos
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
                // Converter 'year' para número
                if (context.column === 'year') {
                    return parseInt(value, 10);
                }
                // Converter 'winner' para booleano
                if (context.column === 'winner') {
                    return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
                }
                // Separar 'studios' e 'producers' por vírgula e trim
                if (context.column === 'studios' || context.column === 'producers') {
                    return value.split(',').map(item => item.trim());
                }
                return value;
            }
        }))
        .on('data', (row) => {
            movies.push(row);
        })
        .on('end', async () => {
            console.log(`CSV file successfully processed. Found ${movies.length} movies.`);
            await db.remove({}, { multi: true }); // Limpa o DB antes de inserir (opcional, para testes)
            db.insert(movies, (err, newDocs) => {
                if (err) {
                    console.error('Error inserting movies into DB:', err);
                } else {
                    console.log(`Inserted ${newDocs.length} movies into the database.`);
                }
            });
        })
        .on('error', (error) => {
            console.error('Error parsing CSV:', error.message);
        });
};

module.exports = { loadMoviesFromCsv };