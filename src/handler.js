const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Collection of commands
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');

// Dynamically load all command files
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.set(command.name, command);
    
    // Register aliases if any exist
    if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => commands.set(alias, command));
    }
}

console.log(`Loaded ${commandFiles.length} command files.`);

async function handleMessages(sock, msg) {
    try {
        // Extract text depending on message type (normal text, extended text, image caption, video caption)
        const messageType = Object.keys(msg.message)[0];
        const textMessage = messageType === 'conversation' ? msg.message.conversation 
            : messageType === 'extendedTextMessage' ? msg.message.extendedTextMessage.text 
            : messageType === 'imageMessage' ? msg.message.imageMessage.caption 
            : messageType === 'videoMessage' ? msg.message.videoMessage.caption 
            : '';

        const prefix = process.env.PREFIX || '!';
        
        // Ignore messages that don't start with the defined prefix
        if (!textMessage.startsWith(prefix)) return;

        // Extract command name and arguments
        const args = textMessage.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Check if command exists
        const command = commands.get(commandName);
        
        if (command) {
            // Route to the execute function of the specific command file
            await command.execute(sock, msg, args);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

module.exports = { handleMessages };
