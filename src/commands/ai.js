const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
    name: 'ai',
    aliases: ['gemini', 'chat'],
    description: 'Ask a question to Google Gemini AI',
    async execute(sock, msg, args) {
        const remoteJid = msg.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(
                remoteJid, 
                { text: 'Please provide a prompt. Example: !ai What is the capital of France?' }, 
                { quoted: msg }
            );
        }

        const prompt = args.join(' ');
        
        try {
            // Initialize Gemini with API Key from .env
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            // Send typing indicator
            await sock.sendPresenceUpdate('composing', remoteJid);

            // Fetch AI response
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Send response back
            await sock.sendMessage(
                remoteJid, 
                { text: responseText }, 
                { quoted: msg }
            );
        } catch (error) {
            console.error('Gemini API Error:', error);
            await sock.sendMessage(
                remoteJid, 
                { text: '❌ Failed to generate AI response. Please make sure your GEMINI_API_KEY is correctly set in the .env file.' }, 
                { quoted: msg }
            );
        }
    }
};
