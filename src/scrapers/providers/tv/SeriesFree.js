const Promise = require('bluebird');
const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://seriesfree.to'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const showTitle = req.query.title;
        const { season, episode, year } = req.query;
        let resolvePromises = [];

        try {
            const jar = this.rp.jar();
            const searchTitle = showTitle.replace(/\s+/g, '%20');
            const response = await this._createRequest(this.rp, `${url}/search/${searchTitle}`, jar, { 'user-agent': this.userAgent })
            let $ = cheerio.load(response);

            let showUrl = '';
            $('.serie-title').toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})` || $(element).text() === showTitle) {
                    showUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });
            if (!showUrl) {
                return Promise.resolve();
            }
            const videoPageHtml = await this._createRequest(this.rp, showUrl, jar, { 'user-agent': this.userAgent });
            $ = cheerio.load(videoPageHtml);

            let episodeUrl;
            $('.sinfo').toArray().some(element => {
                if ($(element).text() === `${season}×${episode}`) {
                    episodeUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            if (!episodeUrl) {
                this.logger.debug('SeriesFree', `Could not find: ${showTitle} ${season}×${episode}`);
                return Promise.resolve();
            }

            const episodePageHtml = await this._createRequest(this.rp, episodeUrl, jar, { 'user-agent': this.userAgent });
            $ = cheerio.load(episodePageHtml);
            const resolveLinkPromises = [];
            const videoUrls = $('.watch-btn').toArray().map(element => `${url}${$(element).attr('href')}`);
            resolvePromises = this.resolveVideoLinks(ws, videoUrls);
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }

    /** @inheritdoc */
    async resolveVideoLinks(ws, videoUrls) {
        const resolveLinkPromises = [];        
        videoUrls.forEach((videoUrl) => {
            resolveLinkPromises.push(this.scrapeHarder(videoUrl, ws));
        });
        return resolveLinkPromises;
    }

    async scrapeHarder(videoUrl, ws) {
        try {
            const videoPageHtml = await this._createRequest(this.rp, videoUrl, this.rp.jar(), { 'user-agent': this.userAgent })
            const $ = cheerio.load(videoPageHtml);
            const providerUrl = $('.action-btn').attr('href');
            const headers = {
                'user-agent': this.userAgent,
                'x-real-ip': this.clientIp,
                'x-forwarded-for': this.clientIp
            };

            return this._resolveLink(providerUrl, ws, this.rp.jar(), headers)
        } catch (err) {
            this._onErrorOccurred(err)
        }
    }
}