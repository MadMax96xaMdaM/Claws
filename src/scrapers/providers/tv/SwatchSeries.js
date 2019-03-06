const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const URL = require('url');
const { absoluteUrl, removeYearFromTitle } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class SwatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["https://www1.swatchseries.to"];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const showTitle = req.query.title;
        const { season, episode, year } = req.query;
        const searchTitle = showTitle.replace(/\s+/g, '%20').toLowerCase();
        const searchUrl = `${url}/search/${searchTitle}`;
        let resolvePromises = [];
        const headers = {
            'user-agent': this.userAgent,
            'x-real-ip': this.clientIp,
            'x-forwarded-for': this.clientIp
        };

        try {
            const response = await this._createRequest(this.rp, searchUrl, this.rp.jar(), {
                'user-agent': this.userAgent,
                referer: url
            });
            let $ = cheerio.load(response);
            let showUrl = '';
            $(`a strong`).toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})` || $(element).text() === `${showTitle} (${year}) (${year})` || $(element).text() === showTitle) {
                    showUrl = $(element).parent().attr('href');
                    return true;
                }
                return false;
            });

            if (!showUrl) {
                // Don't attempt to make requests on empty URLs.
                this.logger.debug(`${this.getProviderId()} - no urls found for ${showTitle}`)
                return Promise.all(resolvePromises);
            }
            const videoPageHtml = await this._createRequest(this.rp, showUrl);

            $ = cheerio.load(videoPageHtml);


            // const episodeUrl = $(`a[href*="s${season}_e${episode}.html"]`).attr('href');
            let episodeUrl = '';
            $(`div[itemtype="http://schema.org/TVSeason"]`).toArray().some(seasonDiv => {
                const seasonSpan = $(seasonDiv).find('a[itemprop="url"] > span[itemprop="name"]');
                if (seasonSpan.length && seasonSpan.text() === `Season ${season}`) {
                    const episodeListItem = $(seasonDiv).find(`li[itemtype="http://schema.org/TVEpisode"]:has(meta[itemprop="episodenumber"][content="${episode}"])`);
                    episodeUrl = episodeListItem.find('a').attr('href');
                    return true;
                }

                return false;
            });

            if (!episodeUrl) {
                return Promise.resolve();
            }

            const episodePageHtml = await this._createRequest(this.rp, episodeUrl, this.rp.jar(), {
                'user-agent': this.userAgent
            });
            $ = cheerio.load(episodePageHtml);
            const videoUrls = $('.watchlink').toArray().map(element => URL.parse($(element).attr('href') || '', true).query.r).filter(url => !!url).map(url => Buffer.from(url, 'base64').toString());
            resolvePromises = this.resolveVideoLinks(ws, videoUrls, headers);
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}