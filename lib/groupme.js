const GroupMeStream = require('./groupme-stream');
const Chatbot = require('./chatbot.js');
const ChatClient = require('./chat-client.js');

const groupmeBaseUrl = 'https://api.groupme.com/v3';
const axios = require('axios');

class GroupMe extends ChatClient {
    token = process.env.GROUPME_TOKEN;
    botId = process.env.GROUPME_BOT_ID;
    userId;

    radarr;
    sonarr;

    constructor(radarr) {
        super();
        this._setUserId();

        this.radarr = radarr;
    }

    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            const config = {
                params: {
                    token: this.token
                }
            };

            const data = {
                bot_id: this.botId,
                text: message
            };

            const url = groupmeBaseUrl + '/bots/post';
            axios.post(url, data, config).then(response => {
                resolve(response);
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }

    _setUserId() {
        const config = {
            params: {
                token: this.token
            }
        };

        const url = groupmeBaseUrl + '/users/me';
        axios.get(url, config).then(response => {
            this.userId = response.data.response.id;
            this._setupListeners();
        }).catch(err => {
            console.error(err);
        });
    }

    _setupListeners() {
        const stream = new GroupMeStream(
            this.token,
            this.userId,
        );

        stream.connect();

        stream.on('message', async (_msg) => {
            if (_msg && _msg.data && _msg.data.subject) {
                const data = _msg.data;
                const msg = data.subject;
                const type = msg.sender_type;
                const groupId = msg.group_id;
                const userId = msg.sender_id;
                const userHash = `groupme_${groupId}_${userId}`;

                if (type !== 'bot') {
                    const chatbot = new Chatbot(this, this.radarr);
                    await chatbot.receiveMessage(userHash, msg.text);
                }
            }
        });

        stream.on('error', (data) => {
            console.log('GroupMe error occurred');
            console.error(data);
        });

        stream.on('connected', (data) => {
            console.log('GroupMe connection established');
        });

        stream.on('pending', (data) => {
            console.log('Setting up GroupMe connection');
        });

        stream.on('disconnected', (data) => {
            console.log('GroupMe has disconnected');
            console.log(data);
        });
    }
}

module.exports = GroupMe;
