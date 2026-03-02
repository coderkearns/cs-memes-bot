require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const memes = require('./memes');
const deseret = require('./deseret');

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is ready!');

    memes.setup(client);
    deseret.setup(client);
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('Error: DISCORD_TOKEN not found in environment variables');
    console.error('Please create a .env file with your Discord bot token');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('Failed to login:', error.message);
    process.exit(1);
});
