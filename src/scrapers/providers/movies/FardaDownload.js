const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class FardaDownload extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://fardadownload.org'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const resolvePromises = [];
        let headers = {};
    
        try {
            const searchTitle = `${title} ${year}`;
            let searchUrl = (`${url}/?s=${searchTitle.replace(/ /g, '%20')}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);
            
            let $ = cheerio.load(response);
            
            let videoPage = '';
            $('.post-title a').toArray().forEach(element => {

                let contentTitle = $(element).find('h2').text().toLowerCase();
                let contentPage = $(element).attr('href');

                if (contentTitle.includes(searchTitle)) {
                    videoPage = contentPage;
                }
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);
            
            $('a.dl_bx_mv').toArray().forEach(element => {
                const directLink = $(element).attr('href');
                resolvePromises.push(this.resolveLink(directLink, ws, jar, headers));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
