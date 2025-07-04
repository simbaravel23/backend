// src/services/dataService.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { db } = require('../config/database');

const CSV_FILE_PATH = path.join(__dirname, '../../data/movielist.csv');

const loadMoviesFromCsv = () => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found at: ${CSV_FILE_PATH}`);
        return;
    }

    const movies = [];
    fs.createReadStream(CSV_FILE_PATH)
        .pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter: ';', // <--- ESTA LINHA É CRÍTICA!
            cast: (value, context) => {
                if (context.column === 'year') {
                    return parseInt(value, 10);
                }
                if (context.column === 'winner') {
                    return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
                }
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
            await db.remove({}, { multi: true });
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