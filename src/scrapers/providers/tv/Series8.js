const Promise = require('bluebird');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const { absoluteUrl, padTvNumber } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class Series8 extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www2.seriesonline8.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const showTitle = req.query.title.toLowerCase();
        const { season, episode, year } = req.query;
        let resolvePromises = [];
        const headers = {
            'user-agent': this.userAgent,
            'x-real-ip': this.remoteAddress,
            'x-forwarded-for': this.remoteAddress
        };

        try {
            const searchTitle = showTitle.replace(/\s+/g, '-');
            let searchUrl = (`${url}/movie/search/${searchTitle}`);
            const response = await this._createRequest(this.rp, searchUrl);
            let $ = cheerio.load(response);

            const escapedShowTitle = showTitle.replace(/[^a-zA-Z0-9]+/g, '-');
            let isPadded = true;
            const paddedSeason = padTvNumber(season);
            let linkText = `${escapedShowTitle}-${year}-season-${paddedSeason}`;
            let seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
            if (!seasonLinkElement.length) {
                isPadded = false;
                linkText = `${escapedShowTitle}-${year}-season-${season}`;
                seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                if (!seasonLinkElement.length) {
                    isPadded = true;
                    linkText = `${escapedShowTitle}-season-${paddedSeason}`;
                    seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                    if (!seasonLinkElement.length) {
                        isPadded = false;
                        linkText = `${escapedShowTitle}-season-${season}`;
                        seasonLinkElement = $(`a.ml-mask[href="/film/${linkText}"]`);
                    }
                }
            }
            if (!seasonLinkElement.length) {
                // No season link.
                this.logger.debug('Series8', `Could not find: ${showTitle} (${year}) Season ${season}`);
                return Promise.all(resolvePromises);
            }

            const seasonPageLink = absoluteUrl(url, `/film/${linkText}`);

            const formattedEpisode = isPadded ? padTvNumber(episode) : episode;
            const episodeLink = `${seasonPageLink}/watching.html`;
            const episodePageHtml = await this._createRequest(this.rp, episodeLink);
            
            $ = cheerio.load(episodePageHtml);
            const videoUrls = $('.btn-eps').toArray().filter((url) => {
                if ($(url).attr('episode-data') === formattedEpisode.toString()) {
                    return $(url).attr('player-data');
                }
            }).map(url => $(url).attr('player-data'));
            resolvePromises = this.resolveVideoLinks(ws, videoUrls, headers)
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
