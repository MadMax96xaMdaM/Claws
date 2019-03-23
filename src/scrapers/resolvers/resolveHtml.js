const rp = require('request-promise');

const resolvers = {
    Openload: require('./Openload').OpenloadHtml,
    Streamango: require('./Streamango').StreamangoHtml,
    //Streamcherry: require('./Streamcherry').StreamcherryHtml,
    // RapidVideo: require('./RapidVideo'),
    // AZMovies: require('./AZMovies'),
    // Vidlox: require('./Vidlox'),
    VShare: require('./VShare').VShareHtml,
    // SpeedVid: require('./SpeedVid'),
    // VidCloud: require('./VidCloud'),
    // ClipWatching: require('./ClipWatching'),
    // EStream: require('./EStream'),
    // Vidzi: require('./Vidzi'),
    // VidTodo: require('./VidTodo'),
    PowVideo: require('./PowVideo').PowVideoHtml,
    GamoVideo: require('./GamoVideo').GamoVideoHtml,
    // GorillaVid: require('./GorillaVid'),
    // DaClips: require('./DaClips'),
    // MovPod: require('./MovPod'),
    Vidoza: require('./Vidoza').VidozaHtml,
    // StreamM4u: require('./StreamM4u'),
    GoogleDrive: require('./GoogleDrive').GoogleDriveHtml
};

const createEvent = require('../../utils/createEvent');

async function resolveHtml(html, resolver, headers, cookie) {
    const jar = rp.jar();
    const data = await resolvers[resolver](html, jar, headers);

    if (resolver === 'Openload') {
        return [createEvent(data, false, {}, {quality: '', provider: 'Openload', cookie, isResultOfScrape: true})];

    } else if (resolver === 'Streamango') {
        return [createEvent(data, false, {}, {quality: '', provider: 'Streamango', cookie, isResultOfScrape: true})];

    } else if (resolver === 'Streamcherry') {
        return [createEvent(data, false, {}, {quality: '', provider: 'Streamcherry', cookie, isResultOfScrape: true})];

    } else if (resolver === 'VShare') {
        return [createEvent(data, false, {}, {quality: '', provider: 'VShare', cookie, isResultOfScrape: true})];

    } else if (resolver === 'PowVideo') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, {}, {quality: '', provider: 'PowVideo', cookie, isResultOfScrape: true}));
        });
        return dataList;

    } else if (resolver === 'GamoVideo') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(dataObject, false, {}, {quality: '', provider: 'GamoVideo', cookie, isResultOfScrape: true}));
        });
        return dataList;

    } else if (resolver === 'Vidoza') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(dataObject.src, false, {}, {quality: dataObject.res, provider: 'Vidoza', cookie, isResultOfScrape: true}));
        });
        return dataList;

    } else if (resolver === 'GoogleDrive') {
        const dataList = [];
        data.forEach(dataObject => {
            dataList.push(createEvent(dataObject.link, false, {}, {quality: dataObject.quality, provider: 'GoogleDrive', cookie, isResultOfScrape: true}));
        });
        return dataList;

    } else {
        throw `Resolver ${resolver} not supported`;
    }
}

module.exports = exports = resolveHtml;