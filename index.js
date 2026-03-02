require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const memes = require('./memes');
const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is ready!');

    if (!config.memes.SEND_MEMES) {
        if (!process.env.CHANNEL_ID) {
            console.warn('Warning: CHANNEL_ID not set in environment variables');
            console.warn('Set CHANNEL_ID in .env file to start sending memes');
        } else {
            console.log(`Will send memes to channel: ${process.env.CHANNEL_ID}`);
            // Send first meme after bot is ready
            memes.setChannelId(process.env.CHANNEL_ID);
            memes.sendMeme(client);
        }
    }
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
