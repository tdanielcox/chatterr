require('dotenv').config();
require('./lib/db').config();

const express = require('express');
const app = express();
const port = process.env.PORT;

const GroupMe = require('./lib/groupme.js');
const Radarr = require('./lib/radarr.js');

app.listen(port, async () => {
    if (process.env.ENABLE_GROUPME === 'true') {
        new GroupMe(new Radarr());
    }

    console.log(`Talkerr listening at http://localhost:${port}`);
});




