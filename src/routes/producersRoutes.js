// src/routes/producersRoutes.js
const express = require('express');
const { getProducersWinIntervals } = require('../services/producerService');
const router = express.Router();

// Rota para obter o intervalo de prêmios de produtores
router.get('/interval-of-wins', async (req, res) => {
    try {
        const result = await getProducersWinIntervals();
        res.json(result);
    } catch (error) {
        console.error('Error in /api/producers/interval-of-wins:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;