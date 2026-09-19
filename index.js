require('dotenv').config();
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { handleMessages } = require('./src/handler');

async function connectToWhatsApp() {
    // Multi-file auth state saves sessions to avoid scanning QR code every time
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Suppress massive Baileys logs
        printQRInTerminal: true,
        auth: state,
        generateHighQualityLinkPreview: true,
    });

    // Save credentials whenever updated
    sock.ev.on('creds.update', saveCreds);

    // Handle connection changes (QR code, disconnection, reconnection)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
            
            // Reconnect if not logged out explicitly
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log('Logged out. Please delete the "auth_info_baileys" folder and scan the QR code again.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot successfully connected to WhatsApp!');
        }
    });

    // Listen for incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        // Only process new, incoming messages (ignore your own messages/history sync)
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        await handleMessages(sock, msg);
    });
}

// Start the bot
connectToWhatsApp();
