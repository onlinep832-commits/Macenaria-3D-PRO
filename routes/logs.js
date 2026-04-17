const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Registrar log
router.post('/log-export', (req, res) => {
    const { usuario, tipo, nomeArquivo } = req.body;
    if (!usuario || !tipo || !nomeArquivo) return res.status(400).json({ erro: 'Dados incompletos' });

    const data = new Date().toISOString();
    const linha = `[${data}] ${usuario} - ${tipo} - ${nomeArquivo}\n`;
    fs.appendFile(path.join(__dirname, '../public/output/logs/export.log'), linha, err => {
        if (err) return res.status(500).json({ erro: 'Erro ao registrar log' });
        res.json({ ok: true });
    });
});

module.exports = router;
