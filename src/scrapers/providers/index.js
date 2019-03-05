'use strict';

module.exports = exports = {
    movies: [
        new (require('./movies/Afdah'))(),
        new (require('./movies/AZMovies'))(),
        new (require('./movies/bfmovies'))(),
        new (require('./movies/StreamM4u'))(),
        //require('./movies/MovieFiles'),
    ],
    tv: [
        new (require('./tv/SeriesFree'))(),
        new (require('./tv/GoWatchSeries'))(),
        new (require('./tv/SwatchSeries'))(),
        //require('./tv/AfdahTV'),
        new (require('./tv/series8'))()
    ],
    anime: [
        new (require('./anime/MasterAnime'))(),
    ],
    universal: [
        new (require('./universal/123movie'))(),
        new (require('./anime/MasterAnime'))(),
        //require('./universal/5movies')
        new (require('./universal/FardaDownload'))()
    ]
};
