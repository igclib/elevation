const {json, send} = require('micro');
const limitedMap = require('limited-map');
const query = require('micro-query');
const cors = require('micro-cors')();
const {FileTileSet, S3TileSet} = require('./tileset');
const crypto = require('crypto');
const keys = require('./keys.js');

const cacheSize = process.env.TILE_SET_CACHE || 128;
const tileFolder = process.env.TILE_SET_PATH || __dirname;
const maxPostSize = process.env.MAX_POST_SIZE || '5000kb';
const maxParallelProcessing = 500;
const allKeys = keys.get();

const tiles = new FileTileSet(tileFolder, {cacheSize});

async function handlePOST(req, res) {
  const payload = await json(req, {limit: maxPostSize});
  const reqQuery = query(req);
  const apiKey = reqQuery.key;

  if (!apiKey) {
    return send(res, 400, {
      error: keys.message('Missing'),
    });
  }

  if (verifyKey(apiKey) < 0) {
    return send(res, 400, {
      error: keys.message('Invalid'),
    });
  }

  if (!payload || !Array.isArray(payload) ||
      !payload.every(
          ([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))) {
    return send(res, 400, {
      error:
          'Invalid Payload. Expected a JSON array with latitude-longitude pairs: [[lat, lon], ...]'
    });
  }

  const result = await limitedMap(
      payload, ll => tiles.getElevation(ll), maxParallelProcessing);
  return result;
}

async function handleGET(req, res) {
  const reqQuery = query(req);
  const apiKey = reqQuery.key;
  if (!apiKey) {
    return send(res, 400, {
      error: keys.message('Missing'),
    });
  }

  if (verifyKey(apiKey) < 0) {
    return send(res, 400, {
      error: keys.message('Invalid'),
    });
  }

  const lat = parseFloat(reqQuery.lat);
  const lon = parseFloat(reqQuery.lon);
  if (lat == null || !Number.isFinite(lat)) {
    return send(res, 400, {
      error:
          'Invalid Latitude. Expected a float number as query parameter: ?lat=12.3&lon=45.6'
    });
  }
  if (lon == null || !Number.isFinite(lon)) {
    return send(res, 400, {
      error:
          'Invalid Longitude. Expected a float number as query parameter: ?lat=12.3&lon=45.6'
    });
  }
  const result = await tiles.getElevation([lat, lon]);
  return result;
}

async function handleGETStatus(req, res) {
  return send(res, 200, 'Ok');
}

async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      if (req.url == '/status') {
        return handleGETStatus(req, res);
      } else {
        return handleGET(req, res);
      }
    case 'OPTIONS':
      send(res, 200, '');
      return;
    default:
      return send(res, 405, {error: 'Only GET or POST allowed'});
  }
}

// This function verifies if the hash of the API key passed by the user request
// matches an authorized key stored inside keys.js file
function verifyKey(key) {
  const shasum = crypto.createHash('sha256');
  shasum.update(key);
  const digest = shasum.digest('hex');
  return allKeys.indexOf(digest);
}

module.exports = cors(handler);
