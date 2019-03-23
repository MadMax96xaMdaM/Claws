'use strict';

// Load providers
const providers = require('../scrapers/providers');

const BaseProvider = require('../scrapers/providers/BaseProvider');

const WsWrapper = require('../utils/WsWrapper');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (ws) => ws.send(JSON.stringify({data: [`${new Date().getTime()}`], event: 'status'}));

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (data, ws, req) => {
    const type = data.type;

    sendInitialStatus(ws);

    const wsWrapper = new WsWrapper(ws, data.options);

    ws.on('close', () => {
        wsWrapper.stopExecution = true;
    });

    const promises = [];

    req.query = data;

    // Get available providers.
    let availableProviders = [...providers[type], ...providers.universal];

    // Add anime providers if Anime tag sent from client.
    // TODO: Add and send this tag from the client
    if (type === 'anime') {
        availableProviders.push([...providers.anime]);
    }

    availableProviders.forEach((provider) => promises.push(provider.resolveRequests(req, wsWrapper)));

    await Promise.all(promises);

    ws.send(JSON.stringify({event: 'done'}));
};

module.exports = resolveLinks;
