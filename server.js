
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Redireciona a raiz para a tela de login
app.get('/', (req, res) => {
    res.redirect('/public/login.html');
});

// Rotas
try {
    const authRoutes = require('./routes/auth');
    app.use('/api', authRoutes);
} catch (e) {
    console.warn('Rota auth não encontrada:', e.message);
}
try {
    const fileRoutes = require('./routes/files');
    app.use('/api', fileRoutes);
} catch (e) {
    console.warn('Rota files não encontrada:', e.message);
}
try {
    const logRoutes = require('./routes/logs');
    app.use('/api', logRoutes);
} catch (e) {
    console.warn('Rota logs não encontrada:', e.message);
}

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
