// Este seria um serviço backend separado para WhatsApp (Node.js 18+)
// Arquivo de referência: whatsapp-service.js

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let client;
let isReady = false;
let qrString = '';

// Inicializar cliente WhatsApp
function initializeWhatsApp() {
    client = new Client({
        authStrategy: new LocalAuth(),
    });

    client.on('qr', (qr) => {
        console.log('QR Code recebido, escaneie com seu celular:');
        qrcode.generate(qr, { small: true });
        qrString = qr;
    });

    client.on('ready', () => {
        console.log('WhatsApp Web está pronto!');
        isReady = true;
    });

    client.on('authenticated', () => {
        console.log('WhatsApp autenticado!');
    });

    client.on('auth_failure', msg => {
        console.error('Falha na autenticação:', msg);
    });

    client.initialize();
}

// Rotas da API
app.get('/whatsapp/status', (req, res) => {
    res.json({
        ready: isReady,
        qr: qrString,
        timestamp: new Date().toISOString()
    });
});

app.post('/whatsapp/send', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não está pronto'
            });
        }

        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({
                success: false,
                error: 'Número e mensagem são obrigatórios'
            });
        }

        // Formatar número (remover caracteres especiais e adicionar @c.us)
        const chatId = number.replace(/\D/g, '') + '@c.us';
        
        // Enviar mensagem
        await client.sendMessage(chatId, message);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(3002, () => {
    console.log('Servidor WhatsApp rodando na porta 3002');
    initializeWhatsApp();
});

export default app;