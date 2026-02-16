# cs-memes-bot

A simple Discord bot that automatically sends memes from Reddit at random intervals, with configurable curfew hours.

## Features

- 🎲 Fetches memes from Reddit via [D3vd/Meme_Api](https://github.com/D3vd/Meme_Api)
- ⏰ Random posting intervals (configurable min/max wait time)
- 🌙 Curfew hours - bot won't send memes during specified hours (e.g., 11pm - 9am)
- 🎯 Support for multiple subreddits - picks randomly if configured as an array

## Setup

### 1. Prerequisites

- Node.js (v16 or higher)
- A Discord bot token ([Create one here](https://discord.com/developers/applications))

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/coderkearns/cs-memes-bot.git
cd cs-memes-bot

# Install dependencies
npm install
```

### 3. Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CHANNEL_ID=your_channel_id_here
   ```

3. (Optional) Customize `config.js`:
   ```javascript
   module.exports = {
       // Single subreddit
       SUBREDDIT: "wholesomememes",
       
       // Or multiple subreddits (picks randomly)
       // SUBREDDIT: ["wholesomememes", "memes", "dankmemes"],
       
       // Random wait time between posts (in milliseconds)
       // Default: 30 minutes to 6 hours
       RANDOM_WAIT: { min: 1000 * 60 * 30, max: 1000 * 60 * 60 * 6 },
       
       // Curfew hours (24-hour format)
       // Bot won't send memes during these hours
       // Default: 11pm (23:00) to 9am (09:00)
       CURFEW_HOURS: { start: 23, end: 9 }
   }
   ```

### 4. Getting Your Channel ID

1. Enable Developer Mode in Discord: Settings → Advanced → Developer Mode
2. Right-click on the channel where you want memes sent
3. Click "Copy ID"
4. Paste this ID into your `.env` file

### 5. Bot Permissions

Your bot needs the following permissions:
- View Channels
- Send Messages
- Embed Links

Invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=52224&scope=bot
```

## Usage

Start the bot:
```bash
npm start
```

The bot will:
1. Log in to Discord
2. Wait a random amount of time (between configured min/max)
3. Check if it's during curfew hours
4. If not curfew, fetch and send a meme
5. Repeat!

## Configuration Options

### SUBREDDIT
- **Type**: `string` or `array of strings`
- **Example**: `"wholesomememes"` or `["wholesomememes", "memes", "dankmemes"]`
- **Description**: The subreddit(s) to fetch memes from. If an array, a random subreddit is chosen each time.

### RANDOM_WAIT
- **Type**: `object { min: number, max: number }`
- **Example**: `{ min: 1000 * 60 * 30, max: 1000 * 60 * 60 * 6 }`
- **Description**: Random wait time in milliseconds between posts. Bot waits a random duration between min and max.

### CURFEW_HOURS
- **Type**: `object { start: number, end: number }`
- **Example**: `{ start: 23, end: 9 }`
- **Description**: Hours when the bot won't send memes (24-hour format). Supports overnight curfews (e.g., 23:00 to 09:00).

## License

ISC