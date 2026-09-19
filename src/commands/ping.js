module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Check if the bot is alive',
    async execute(sock, msg, args) {
        const remoteJid = msg.key.remoteJid;
        
        await sock.sendMessage(
            remoteJid, 
            { text: '🏓 Pong! Bot is active and running.' }, 
            { quoted: msg }
        );
    }
};
