// Servidor WhatsApp simplificado para Node 14+
const express = require('express');
const cors = require('cors');

console.log('🚀 Servidor WhatsApp Mock iniciado!');
console.log('📱 Node.js version:', process.version);

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;
let hasSession = false;

// Mock status
app.get('/whatsapp/status', (req, res) => {
    res.json({
        ready: isConnected,
        hasQR: !hasSession,
        nodeVersion: process.version,
        message: isConnected ? 'WhatsApp conectado!' : 'WhatsApp desconectado - escaneie QR Code',
        timestamp: new Date().toISOString()
    });
});

// Mock envio
app.post('/whatsapp/send', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({
                success: false,
                error: 'Número e mensagem são obrigatórios'
            });
        }

        // Simular envio
        console.log('📤 Enviando mensagem (SIMULAÇÃO):');
        console.log('📞 Para:', number);
        console.log('💬 Mensagem:', message);
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Por enquanto, abre WhatsApp Web como fallback
        console.log('🌐 Redirecionando para WhatsApp Web...');
        
        res.json({
            success: true,
            message: 'Mensagem "enviada" - abrindo WhatsApp Web',
            to: number,
            fallback: `https://wa.me/55${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simular conexão após 5 segundos
setTimeout(() => {
    console.log('🔗 Simulando conexão WhatsApp...');
    isConnected = true;
    hasSession = true;
    console.log('✅ WhatsApp "conectado" (modo simulação)');
}, 5000);

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Status: http://localhost:${PORT}/whatsapp/status`);
    console.log('🔧 Para versão completa, atualize para Node.js 18+');
});