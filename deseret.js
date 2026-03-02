const config = require('./config');

// example
/*
POST
http://2deseret.com/json/translation
{"english": "Learning the Deseret Alphabet is fun."}

returns

{
    "deseret": "𐐢𐐲𐑉𐑌𐐮𐑍 𐑄 𐐔𐐯𐑅𐐨𐑉𐐯𐐻 𐐈𐑊𐑁𐐰𐐺𐐯𐐻 𐐮𐑆 𐑁𐐲𐑌."
}
*/

async function translateToDeseret(englishText) {
    try {
        const response = await fetch('http://2deseret.com/json/translation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ english: englishText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.deseret;
    } catch (error) {
        console.error('Error translating to Deseret:', error);
        throw error;
    }
}


function setup(client) {
    if (!config.deseret.RESPOND_TO_DESERET) return

    // register a command to respond to "deseret"
    client.on('messageCreate', async message => {
        if (message.content.toLowerCase().startsWith('!deseret')) {
            const englishText = message.content.slice('!deseret'.length).trim();
            if (!englishText) {
                message.reply('Please provide text to translate. Usage: `!deseret Your text here`');
                return;
            }

            try {
                const deseretTranslation = await translateToDeseret(englishText);
                message.reply(deseretTranslation);
            } catch (error) {
                console.error('Error translating to Deseret:', error);
                message.reply('Sorry, there was an error translating to Deseret.');
            }
        }
    });

    // set status to URL
    const URL = "https://www.deseretalphabet.info/XKCD"
    client.user.setPresence({
        activities: [{
            name: `${URL}`,
            type: 4 // Custom status
        }],
        status: 'online'
    });
}

module.exports = {
    setup
};
