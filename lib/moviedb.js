const MovieDB = require('node-themoviedb');

class TheMovieDB {
    mDB;

    constructor() {
        const options = {};
        this.mDB = new MovieDB(process.env.THEMOVIEDB_KEY, options);
    }

    async findMovie(id) {
        const args = {
            pathParameters: {
                movie_id: id,
            },
        };

        const details = await this.mDB.movie.getCredits(args);
        let cast = '';

        if (details && details.data) {
            const data = details.data;

            if (data.cast) {
                cast = data.cast.slice(0, 2).map(c => c.name).join(', ');
            }
        }

        return {
            cast
        }
    }
}

module.exports = TheMovieDB;
