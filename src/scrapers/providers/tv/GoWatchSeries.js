const Promise = require('bluebird');
const cheerio = require('cheerio');
const { padTvNumber } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class GoWatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://gowatchseries.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const showTitle = req.query.title.toLowerCase();
        const { season, episode, year } = req.query;
        let headers = {
            'user-agent': this.userAgent,
            'x-real-ip': this.remoteAddress,
            'x-forwarded-for': this.remoteAddress
        }
        let resolvePromises = [];

        try {
            const searchUrl = showTitle.replace(/ /, '%20');
            const response = await this._createRequest(this.rp, `${url}/search.html?keyword=${searchUrl}`, this.rp.jar(), headers);
            let $ = cheerio.load(response);

            const escapedShowTitle = showTitle.replace(/[^a-zA-Z0-9]+/g, '-');
            let isPadded = true;
            const paddedSeason = padTvNumber(season);
            let linkText = `${escapedShowTitle}-${year}-season-${paddedSeason}`;
            let seasonLinkElement = $(`a[href="/info/${linkText}"]`);
            if (!seasonLinkElement.length) {
                isPadded = false;
                linkText = `${escapedShowTitle}-${year}-season-${season}`;
                seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                if (!seasonLinkElement.length) {
                    isPadded = true;
                    linkText = `${escapedShowTitle}-season-${paddedSeason}`;
                    seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                    if (!seasonLinkElement.length) {
                        isPadded = false;
                        linkText = `${escapedShowTitle}-season-${season}`;
                        seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                    }
                }
            }
            if (!seasonLinkElement.length) {
                this.logger.debug('GoWatchSeries', `Could not find: ${showTitle} (${year}) Season ${season}`);
                return Promise.resolve();
            }

            linkText += `-episode-${isPadded ? padTvNumber(episode) : episode}`;

            const episodeLink = `${url}/${linkText}`;

            const episodePageHtml = await this._createRequest(this.rp, episodeLink, this.rp.jar(), headers);
            $ = cheerio.load(episodePageHtml);
            const videoUrls = [];
            $('.anime_muti_link').children().toArray().forEach((tag) => {
                if (tag.name === 'ul') {
                    tag.children.forEach((t) => {
                        if (t.name === 'li') {
                            videoUrls.push(t.attribs['data-video']);
                        }
                    })
                }
            });
            headers = {
                'user-agent': this.userAgent,
                'x-real-ip': this.clientIp,
                'x-forwarded-for': this.clientIp
            };
            resolvePromises = this.resolveVideoLinks(ws, videoUrls, headers)
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}