// Rota para solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ ok: false, error: 'Informe o e-mail.' });
    const usuarios = lerUsuarios();
    const user = usuarios.find(u => u.email === email);
    if (!user) return res.json({ ok: false, error: 'E-mail não encontrado.' });

    // Gera token temporário (expira em 15 min)
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `https://seusite/resetar-senha?token=${token}`;

    // Envia e-mail com o link
    const mailOptions = {
        from: process.env.EMAIL_USER || 'SEU_EMAIL_AQUI',
        to: email,
        subject: 'Recuperação de Senha - Planejador 3D',
        text: `Olá!\n\nClique no link para redefinir sua senha: ${resetLink}\n\nSe não foi você, ignore este e-mail.`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            return res.json({ ok: false, error: 'Erro ao enviar e-mail.' });
        }
        registrarLog('RECUPERAR_SENHA', email, true);
        return res.json({ ok: true, msg: 'E-mail de recuperação enviado.' });
    });
});

// Rota para redefinir senha
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.json({ ok: false, error: 'Token e nova senha obrigatórios.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const usuarios = lerUsuarios();
        const user = usuarios.find(u => u.email === decoded.email);
        if (!user) return res.json({ ok: false, error: 'Usuário não encontrado.' });
        user.password = await bcrypt.hash(password, 10);
        salvarUsuarios(usuarios);
        registrarLog('RESETAR_SENHA', decoded.email, true);
        return res.json({ ok: true, msg: 'Senha redefinida com sucesso.' });
    } catch (err) {
        registrarLog('RESETAR_SENHA', '', false);
        return res.json({ ok: false, error: 'Token inválido ou expirado.' });
    }
});
// Função para registrar logs
function registrarLog(tipo, email, sucesso) {
    const data = new Date().toISOString();
    const linha = `[${data}] ${tipo} - ${email} - ${sucesso ? 'SUCESSO' : 'FALHA'}\n`;
    const logPath = path.join(__dirname, '../logs/acessos.log');
    fs.appendFile(logPath, linha, err => {
        if (err) console.error('Erro ao registrar log:', err);
    });
}
const express = require('express');
const router = express.Router();


const fs = require('fs');
const path = require('path');

const bcrypt = require('bcrypt');

const nodemailer = require('nodemailer');
const USERS_FILE = path.join(__dirname, '../senhas/users.json');

// Configuração do Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'SEU_EMAIL_AQUI',
        pass: process.env.EMAIL_PASS || 'SENHA_DE_APP_AQUI'
    }
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';

function lerUsuarios() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function salvarUsuarios(usuarios) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2));
}

// Cadastro
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        registrarLog('CADASTRO', email, false);
        return res.json({ ok: false, error: 'Preencha todos os campos.' });
    }
    const usuarios = lerUsuarios();
    if (usuarios.find(u => u.email === email)) {
        registrarLog('CADASTRO', email, false);
        return res.json({ ok: false, error: 'E-mail já cadastrado.' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        usuarios.push({ username, email, password: hash });
        salvarUsuarios(usuarios);

        // Envia e-mail de confirmação
        const mailOptions = {
            from: process.env.EMAIL_USER || 'SEU_EMAIL_AQUI',
            to: email,
            subject: 'Confirmação de Cadastro - Planejador 3D',
            text: `Olá, ${username}!\n\nSeu cadastro foi realizado com sucesso.\n\nSe não foi você, ignore este e-mail.`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar e-mail:', error);
            } else {
                console.log('E-mail de confirmação enviado:', info.response);
            }
        });

        registrarLog('CADASTRO', email, true);
        return res.json({ ok: true });
    } catch (err) {
        registrarLog('CADASTRO', email, false);
        return res.json({ ok: false, error: 'Erro ao salvar usuário.' });
    }
});


// Login com JWT
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerUsuarios();
    const user = usuarios.find(u => u.email === email);
    if (!user) {
        registrarLog('LOGIN', email, false);
        return res.json({ ok: false, error: 'E-mail ou senha inválidos.' });
    }
    try {
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            registrarLog('LOGIN', email, false);
            return res.json({ ok: false, error: 'E-mail ou senha inválidos.' });
        }
        // Gera token JWT
        const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        registrarLog('LOGIN', email, true);
        return res.json({ ok: true, token, username: user.username });
    } catch (err) {
        registrarLog('LOGIN', email, false);
        return res.json({ ok: false, error: 'Erro ao verificar senha.' });
    }
});

// Middleware para rotas protegidas
function autenticarJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token ausente' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// Exemplo de rota protegida:
router.get('/protegido', autenticarJWT, (req, res) => {
    registrarLog('ACESSO_PROTEGIDO', req.user.email, true);
    res.json({ ok: true, msg: `Bem-vindo, ${req.user.username}!` });
});

module.exports = router;
