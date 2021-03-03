const l = require('./lang');
const u = require('./util');
const db = require('./db').db;

const resultCount = process.env.RESULT_COUNT || 3;
const wakewords = process.env.WAKE_WORDS
    ? process.env.WAKE_WORDS.split(',')
    : ['chatterr', 'c'];

class Chatbot {
    client;
    radarr;

    constructor(client, radarr) {
        this.client = client;
        this.radarr = radarr;
    }

    async receiveMessage(userHash, message) {
        const content = await this.shouldWake(message);
        if (content) {
            console.log(`Received command: ${content}`);

            this.determineMessageIntent(userHash, content);
        }
    }

    async shouldWake(message) {
        const str = u.splitSpace(message.toLowerCase());
        const word = str[0];
        const cmd = str[1];

        if (wakewords) {
            if (word === 'help') {
                return this.sendMessage('help', [wakewords[0]]);
            }

            if (word === 'commands') {
                return this.sendMessage('commands', [wakewords[0]]);
            }

            if (word === 'radarr') {
                return this.radarr.command(this, cmd);
            }

            return wakewords.includes(word) ? cmd : false;
        }

        return false;
    }

    async sendMessage(key, params) {
        params = params || [];
        const msg = (key in l) ? l[key](...params) : key;

        if (Array.isArray(msg)) {
            let loops = 1;
            for (let m of msg) {
                await this._sendMessage(m, loops++);
            }
        } else {
            await this._sendMessage(msg, 1);
        }
    }

    async _sendMessage(msg, loops) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                // console.log('=> ' + msg);
                this.client.sendMessage(msg).then(res => {
                    resolve();
                }).catch(err => {

                });
            }, loops === 1 ? 500 : 1000);
        });
    }

    async determineMessageIntent(userHash, message) {
        const cmdSplit = u.splitSpace(message);
        const cmd = cmdSplit[0];

        switch (cmd) {
            case 'search':
            case 'find':
            case 'f':
                await this.startSearch(cmdSplit[1]);
                break;

            case 'add':
            case 'a':
                await this.addResult(cmdSplit[1]);
                break;

            case 'details':
            case 'detail':
            case 'info':
            case 'i':
            case 'd':
                await this.resultDetails(cmdSplit[1]);
                break;

            case 'ping':
                await this.sendMessage('ping');
                break;

            case 'help':
                await this.sendMessage('help', [wakewords[0]]);
                break;

            case 'commands':
                await this.sendMessage('commands', [wakewords[0]]);
                break;

            default:
                await this.sendMessage('dontUnderstand', [cmd]);
                break;
        }

        return false;
    }

    async startSearch(message) {
        const typeSplit = u.splitSpace(message);
        let type = typeSplit[0];
        let query = typeSplit[1];

        switch (type) {
            case 'movies':
            case 'movie':
            case 'm':
                type = 'movie';
                await this.sendMessage(`Searching for ${type}: "${query}" ...`);
                const results = await this.radarr.lookupMovie(query);

                if (results.length) {
                    const showKey = results[0].id;

                    await this.sendMessage([
                        results.map(r => `${r.id}: ${r.title} (${r.year})`).join('\n'),
                        `Find out more information about a ${type} with the details command.\neg: roach details ${showKey}`,
                        `Use the add command to download any of these results.\neg: roach add ${showKey}`,
                    ]);
                } else {
                    await this.sendMessage(`Could not find any movie results for "${query}"`);
                }

                break;

            case 'tv':
            case 'tvshows':
            case 'tv-shows':
            case 'shows':
            case 'show':
            case 's':
                type = 'show';
                await this.sendMessage(`Searching for ${type}: "${query}" ...`);
                break;

            default:
                await this.sendMessage('unknownType', [type, wakewords[0]]);
                break;
        }
    }

    async addResult(id) {
        let r;

        try {
            r = await db.getRow(id);
        }

        catch (e) {
            return this.sendMessage('rowNotFound', [wakewords[0]]);
        }

        if (r.type === 'movie') {
            const result = `${r.title} (${r.year})`;

            try {
                await this.radarr.addMovie(r.data);
                await this.sendMessage(`Added ${result} to the download queue.`);
            } catch (e) {
                await this.sendMessage(`${result} already exists.`);
            }
        } else {

        }
    }

    async resultDetails(id) {
        let r;

        try {
            r = await db.getRow(id);
        } catch (e) {
            return this.sendMessage('rowNotFound', [wakewords[0]]);
        }

        if (r.type === 'movie') {
            const details = await this.radarr.getDetails(r);
            await this.sendMessage(details);
        }
    }
}

module.exports = Chatbot;
