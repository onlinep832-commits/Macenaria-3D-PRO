const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const usuarios = [];
const TOKEN_SECRET = 'chave-secreta-supersegura';

// Registro
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ ok: false, error: 'Preencha todos os campos.' });
    }
    if (usuarios.find(u => u.email === email)) {
        return res.status(400).json({ ok: false, error: 'E-mail já cadastrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    usuarios.push({ username, email, password: hashedPassword });
    res.json({ ok: true });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = usuarios.find(u => u.email === email);
    if (!user) return res.status(400).json({ ok: false, error: 'Usuário não encontrado.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ ok: false, error: 'Senha inválida.' });

    const token = jwt.sign({ email: user.email }, TOKEN_SECRET, { expiresIn: '1h' });
    res.json({ ok: true, token, username: user.username });
});

module.exports = router;
