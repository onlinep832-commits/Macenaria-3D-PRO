const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function enviarEmailConfirmacao(destino, token) {
    const url = `${process.env.API_URL || 'http://localhost:3000'}/confirmar?token=${token}`;
    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: destino,
        subject: 'Confirmação de Cadastro - Marcenaria_PRO',
        html: `<h2>Bem-vindo ao Planejador 3D!</h2><p>Para ativar sua conta, clique no link abaixo:</p><a href="${url}">${url}</a>`
    });
}

module.exports = { enviarEmailConfirmacao };
