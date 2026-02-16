require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

let channelId = null;
let timeoutId = null;

// Get random subreddit if SUBREDDIT is an array
function getSubreddit() {
    if (Array.isArray(config.SUBREDDIT)) {
        return config.SUBREDDIT[Math.floor(Math.random() * config.SUBREDDIT.length)];
    }
    return config.SUBREDDIT;
}

// Get random wait time between min and max
function getRandomWait() {
    const { min, max } = config.RANDOM_WAIT;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if current time is during curfew hours
function isDuringCurfew() {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = config.CURFEW_HOURS;

    // If start > end, curfew spans midnight (e.g., 23:00 to 09:00)
    if (start > end) {
        return currentHour >= start || currentHour < end;
    }
    // Otherwise, curfew is within same day
    return currentHour >= start && currentHour < end;
}

// Fetch meme from D3vd/Meme_Api
async function fetchMeme() {
    try {
        const subreddit = getSubreddit();
        const response = await axios.get(`https://meme-api.com/gimme/${subreddit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meme:', error.message);
        return null;
    }
}

// Send meme to channel
async function sendMeme() {
    if (!channelId) {
        console.log('No channel configured');
        scheduleNextMeme();
        return;
    }

    // Check if it's curfew time
    if (isDuringCurfew()) {
        console.log('Currently during curfew hours, skipping meme');
        scheduleNextMeme();
        return;
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.log('Channel not found');
        scheduleNextMeme();
        return;
    }

    const meme = await fetchMeme();
    if (meme) {
        try {
            await channel.send({
                embeds: [{
                    title: meme.title,
                    url: meme.postLink,
                    image: { url: meme.url },
                    color: 0x0099ff,
                    footer: { text: `r/${meme.subreddit} • 👍 ${meme.ups}` }
                }]
            });
            console.log(`Meme sent: ${meme.title}`);
        } catch (error) {
            console.error('Error sending meme:', error.message);
        }
    }

    scheduleNextMeme();
}

// Schedule next meme
function scheduleNextMeme() {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    const waitTime = getRandomWait();
    const waitSeconds = Math.floor(waitTime / 1000);
    const waitMinutes = Math.floor(waitSeconds / 60);
    const waitHours = Math.floor(waitMinutes / 60);
    
    let timeStr;
    if (waitHours > 0) {
        const remainingMinutes = waitMinutes % 60;
        timeStr = `${waitHours}h ${remainingMinutes}m`;
    } else if (waitMinutes > 0) {
        timeStr = `${waitMinutes} minutes`;
    } else {
        timeStr = `${waitSeconds} seconds`;
    }
    
    console.log(`Next meme scheduled in ${timeStr}`);
    
    timeoutId = setTimeout(sendMeme, waitTime);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is ready!');
    
    // Set the channel ID from environment variable
    channelId = process.env.CHANNEL_ID;
    
    if (!channelId) {
        console.warn('Warning: CHANNEL_ID not set in environment variables');
        console.warn('Set CHANNEL_ID in .env file to start sending memes');
    } else {
        console.log(`Will send memes to channel: ${channelId}`);
        // Send first meme after bot is ready
        sendMeme();
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
