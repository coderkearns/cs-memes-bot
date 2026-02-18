require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
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

// Fetch images from Reddit
async function getRedditImages(subreddit, limit = 10) {
    const url = `https://www.reddit.com/r/${subreddit}/hot/.json?limit=${limit}`;

    try {
        const response = await fetch(url);
        
        // Check if response is successful
        if (!response.ok) {
            console.error(`Reddit API returned status ${response.status}`);
            return [];
        }
        
        const json = await response.json();

        return json.data.children
            .filter(post => post.data.post_hint === "image")
            .map(post => ({
                title: post.data.title,
                imageURL: post.data.url,
                ups: post.data.ups
            }));
    } catch (error) {
        console.error("Error fetching Reddit data:", error);
        return [];
    }
}

// Fetch meme from Reddit directly
async function fetchMeme() {
    try {
        const subreddit = getSubreddit();
        const count = config.MEME_FETCH_COUNT || 3;
        const memes = await getRedditImages(subreddit, count);
        
        // Handle empty array
        if (!memes || memes.length === 0) {
            console.error('No memes returned from Reddit');
            return null;
        }
        
        // Find meme with highest upvotes
        const bestMeme = memes.reduce((best, current) => 
            current.ups > best.ups ? current : best
        );
        
        // Convert to expected format
        return {
            title: bestMeme.title,
            url: bestMeme.imageURL,
            ups: bestMeme.ups,
            subreddit: subreddit
        };
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
            await channel.send({ content: `r/${meme.subreddit} - ${meme.title}`, files: [{ attachment: meme.url }] });
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

    // Calculate the next scheduled time
    const nextTime = new Date(Date.now() + waitTime);
    let hours = nextTime.getHours();
    const minutes = nextTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12; // Convert to 12-hour format, with 0 becoming 12
    const timeString = `${hours}:${minutes} ${ampm}`;

    // Set bot's custom status
    if (client.user) {
        client.user.setPresence({
            activities: [{
                name: `Next meme at ${timeString}`,
                type: 4 // Custom status
            }],
            status: 'online'
        });
        console.log(`Bot status updated: Next meme at ${timeString}`);
    }

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
