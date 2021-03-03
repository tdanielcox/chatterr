const sqlite3 = require('sqlite3');

class DB {
    db;

    constructor() {
        this.db = new sqlite3.Database(process.env.DB_FILE_PATH, (err) => {
            if (err) {
                console.log('Could not connect to database', err)
            } else {
                this.setup();
                console.log('Connected to database')
            }
        });
    }

    async writeRow(type, title, year, item) {
        return new Promise(async (resolve, reject) => {
            this.db.run('INSERT INTO results (title, type, year, data) VALUES (?, ?, ?, ?)', [
                title,
                type,
                year,
                JSON.stringify(item)
            ], async function (err) {
                if (err) {
                    reject(err);
                } else {
                    const id = this.lastID;
                    resolve(id);
                }
            });
        });
    }

    async getRow(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT id, title, type, year, data FROM results WHERE id = ?', [id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (!result) {
                        return reject('Not found');
                    }

                    result.data = JSON.parse(result.data);
                    resolve(result);
                }
            })
        });
    }

    async setConfig(key, value, noOverride) {
        return new Promise(async (resolve, reject) => {
            const exists = await this.getConfig(key);

            let q = 'INSERT INTO config (value, key) VALUES (?, ?)';
            if (exists) {
                q = 'UPDATE config SET value = ? WHERE key = ?';

                if (noOverride) {
                    return resolve(exists);
                }
            }

            this.db.run(q, [
                value,
                key,
            ], async function (err) {
                if (err) {
                    reject(err);
                } else {
                    const id = this.lastID;
                    resolve(id);
                }
            });
        });
    }

    async getConfig(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT value FROM config WHERE key = ?', [key], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (!result) {
                        return resolve(null);
                    }

                    resolve(result.value);
                }
            })
        });
    }

    async setup() {
        await this.db.run(`CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR,
          type VARCHAR,
          year VARCHAR,
          data TEXT)`);

        await this.db.run(`CREATE TABLE IF NOT EXISTS config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR,
          value VARCHAR)`, async (err, result) => {
            if (err) {
                console.error(err);
            }

            await this.setConfig('radarr_profile', 1, true);
            await this.setConfig('sonarr_profile', 1, true);
        });
    }
}

module.exports = {
    db: {},
    config() {
        this.db = new DB();
    },
};
