// src/services/producerService.js
const { db } = require('../config/database');

const getProducersWinIntervals = () => {
    return new Promise((resolve, reject) => {
        db.find({ winner: true }).sort({ year: 1 }).exec((err, movies) => {
            if (err) {
                return reject(err);
            }

            const producerWins = {}; // { "Producer Name": [year1, year2, ...] }

            movies.forEach(movie => {
                if (movie.producers && movie.producers.length > 0) {
                    movie.producers.forEach(producer => {
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
                if (years.length < 2) {
                    continue; // Precisa de pelo menos duas vitórias para ter um intervalo
                }

                for (let i = 0; i < years.length - 1; i++) {
                    const previousWin = years[i];
                    const followingWin = years[i + 1];
                    const interval = followingWin - previousWin;

                    intervals.push({
                        producer,
                        interval,
                        previousWin,
                        followingWin
                    });
                }
            }

            // Encontrar o menor intervalo
            let minIntervals = [];
            let minVal = Infinity;
            intervals.forEach(item => {
                if (item.interval < minVal) {
                    minVal = item.interval;
                    minIntervals = [item];
                } else if (item.interval === minVal) {
                    minIntervals.push(item);
                }
            });

            // Encontrar o maior intervalo
            let maxIntervals = [];
            let maxVal = -Infinity;
            intervals.forEach(item => {
                if (item.interval > maxVal) {
                    maxVal = item.interval;
                    maxIntervals = [item];
                } else if (item.interval === maxVal) {
                    maxIntervals.push(item);
                }
            });

            resolve({
                min: minIntervals,
                max: maxIntervals
            });
        });
    });
};

module.exports = { getProducersWinIntervals };