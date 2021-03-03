const request = require('request');
const db = require('./db').db;
const movieDB = require('./moviedb');
const u = require('./util');

const resultCount = process.env.RESULT_COUNT || 3;

class Radarr {
    mDB;

    constructor() {
        this.mDB = new movieDB();
    }

    _getUrl(path, queryParams) {
        queryParams = queryParams || {};

        const base = process.env.RADARR_URL;
        const apiPath = 'api/v3';
        const key = process.env.RADARR_API_KEY;

        const queryKeys = Object.keys(queryParams);
        let queries = [`apiKey=${key}`];
        for (let key of queryKeys) {
            queries.push(`${key}=${queryParams[key]}`);
        }

        return `${base}/${apiPath}/${path}?${queries.join('&&')}`;
    }

    async lookupMovie(term) {
        return new Promise((resolve, reject) => {
            const url = this._getUrl('movie/lookup', { term });

            request.get(url, {json: true}, async (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    const res = [];

                    const results = body.slice(0, resultCount);
                    for (let r of results) {
                        const rowId = await db.writeRow('movie', r.title, r.year, r);
                        const row = await db.getRow(rowId);

                        res.push(row);
                    }

                    resolve(res);
                }
            });
        })
    }

    async addMovie(data) {
        return new Promise(async (resolve, reject) => {
            const rootFolder = process.env.RADARR_ROOT_FOLDER;
            const profileId = await db.getConfig('radarr_profile');

            const url = this._getUrl('movie');
            const body = Object.assign({}, data, {
                addOptions: {
                    searchForMovie: true
                },
                qualityProfileId: profileId,
                rootFolderPath: rootFolder,
                folder: data.title,
                monitored: true
            });

            request.post(url, {json: body}, (err, res, body) => {
                if (Array.isArray(body) && body[0].errorCode) {
                    if (body[0].errorCode === 'MovieExistsValidator') {
                        reject('This movie already exists.');
                    }

                    return reject('Unknown error', body);
                }

                if (!err && res.statusCode === 201) {
                    resolve('Added');
                }
            });
        })
    }

    async getQualityProfiles() {
        return new Promise((resolve, reject) => {
            const url = this._getUrl('qualityProfile');

            request.get(url, {json: true}, function(err, res, body) {
                if (!err && res.statusCode === 200) {
                    resolve(body.map((r) => ({
                        id: r.id,
                        title: r.name,
                    })));
                }
            });
        })
    }

    async command(client, message) {
        const str = u.splitSpace(message);
        const cmd = str[0];
        const value = str[1];

        switch (cmd) {
            case 'list_profiles':
                const profiles = await this.getQualityProfiles();
                await client.sendMessage(profiles.map(p => `${p.id}: ${p.title}`).join('\n'));
                break;

            case 'set_profile':
                await db.setConfig('radarr_profile', value);
                await client.sendMessage('Ok, done.');
                break;

            default:
                await client.sendMessage('Huh?');
                break;
        }
    }

    async getDetails(r) {
        const res = [];

        const movieDbDetails = r.data.tmdbId
            ? await this.mDB.findMovie(r.data.tmdbId)
            : {};

        let overview = `${r.title} (${r.year})\n\n`;

        if (movieDbDetails && movieDbDetails.cast) {
            overview += `- ${movieDbDetails.cast}\n`;
        }

        if (r.data.status === 'announced') {
            overview += `- Not yet released\n\n`;
        } else if (r.data.ratings) {
            if (r.data.ratings.value) {
                overview += `- Reviews: ${u.numberToStars(r.data.ratings.value)} (${r.data.ratings.votes})\n\n`;
            } else {
                overview += `- No reviews\n\n`;
            }
        }

        if (r.data.overview) {
            overview += r.data.overview;
        }

        res.push(overview);

        if (r.data.youTubeTrailerId) {
            res.push(u.setupYoutubeUrl(r.data.youTubeTrailerId));
        } else if (r.data.remotePoster) {
            res.push(r.data.remotePoster);
        }

        return res
    }

}

module.exports = Radarr;
