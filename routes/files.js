const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../public/output/import') });

// Listar arquivos
router.get('/listar-arquivos', (req, res) => {
    const dir = req.query.dir;
    if (!dir) return res.status(400).json({ erro: 'Pasta não informada' });
    const fullPath = path.join(__dirname, '../public', dir);
    fs.readdir(fullPath, (err, files) => {
        if (err) return res.status(500).json({ erro: 'Erro ao ler pasta' });
        res.json(files);
    });
});

// Upload
router.post('/upload', upload.single('arquivo'), (req, res) => {
    if (!req.file) return res.status(400).json({ erro: 'Arquivo não enviado' });
    res.json({ ok: true, arquivo: req.file.filename });
});

module.exports = router;
