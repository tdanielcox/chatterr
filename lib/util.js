module.exports = {
    splitSpace(str) {
        try {
            return str.match(/^(\S+)\s(.*)/).slice(1);
        }

        catch (e) {
            return [ str ];
        }
    },

    numberToStars(number) {
        return `${number}/10`;

        // const div = Math.floor(number/2);
        // let res = '';
        // for (let i = 0; i < div; i++) {
        //     res += '*';
        // }
        // return res.padEnd(5, '-');
    },

    setupYoutubeUrl(id) {
        return `https://www.youtube.com/watch?v=${id}`;
    }
};
