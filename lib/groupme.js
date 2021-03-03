const groupmeApi = require('./groupme/groupme').Stateless;
const groupMeStream = require('./groupme/groupme').IncomingStream;
const groupMeImageService = require('./groupme/groupme').ImageService;
const Chatbot = require('./chatbot.js');
const ChatClient = require('./chat-client.js');

class GroupMe extends ChatClient {
    token = process.env.GROUPME_TOKEN;
    botId = process.env.GROUPME_BOT_ID;
    userId;

    radarr;
    sonarr;

    constructor(radarr) {
        super();
        this.setUserId();

        this.radarr = radarr;
    }

    setUserId() {
        groupmeApi.Users.me(this.token, (err,ret) => {
            if (err) {
                return console.error(err);
            }

            this.userId = ret.id;
            this.setupListeners();
        });
    }

    setupListeners() {
        const iStream = new groupMeStream(
            this.token,
            this.userId,
        );

        iStream.connect();

        iStream.on('message', async (_msg) => {
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

        iStream.on('error', (data) => {
            console.log('GroupMe error occurred');
            console.error(data);
        });

        iStream.on('connected', (data) => {
            console.log('GroupMe connection established');
        });

        iStream.on('pending', (data) => {
            console.log('Setting up GroupMe connection');
        });

        iStream.on('disconnected', (data) => {
            console.log('GroupMe has disconnected');
            console.log(data);
        });
    }

    async sendMessage(message) {
        return new Promise((resolve) => {
            groupmeApi.Bots.post(this.token, this.botId, message, {}, (res) => {
                resolve(res);
            });
        });
    }

    async uploadImage(url) {
        return new Promise((resolve, reject) => {
            groupMeImageService.post(url, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(res);
                    resolve(res);
                }
            });
        });
    }
}

module.exports = GroupMe;
