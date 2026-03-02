const config = require('./config');

let channelId = null;
let timeoutId = null;

// Get random subreddit if SUBREDDIT is an array
function getSubreddit() {
    if (Array.isArray(config.memes.SUBREDDIT)) {
        return config.memes.SUBREDDIT[Math.floor(Math.random() * config.memes.SUBREDDIT.length)];
    }
    return config.memes.SUBREDDIT;
}

// Get random wait time between min and max
function getRandomWait() {
    const { min, max } = config.memes.RANDOM_WAIT;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if current time is during curfew hours
function isDuringCurfew() {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = config.memes.CURFEW_HOURS;

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
async function sendMeme(client) {
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
        scheduleNextMeme(client);
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
function scheduleNextMeme(client) {
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

    timeoutId = setTimeout(() => sendMeme(client), waitTime);
}

function setup(client) {
    if (!config.memes.SEND_MEMES) {
        if (!process.env.CHANNEL_ID) {
            console.warn('Warning: CHANNEL_ID not set in environment variables');
            console.warn('Set CHANNEL_ID in .env file to start sending memes');
        } else {
            channelId = process.env.CHANNEL_ID;
            console.log(`Will send memes to channel: ${process.env.CHANNEL_ID}`);

            // Send first meme after bot is ready
            sendMeme(client);
        }
    }
}

module.exports = {
    setup
};
