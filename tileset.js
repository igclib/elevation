const path = require('path');
const {createReadStream} = require('fs');
const {get} = require('https');
const {promisify} = require('util');
const {createGunzip} = require('zlib');
const memoize = require('lru-memoize').default;

const HGT = require('./hgt');

class TileSet {
  constructor(options) {
    this.options = Object.assign({}, {cacheSize: 128, gzip: true}, options);
    this.getTile = memoize(this.options.cacheSize)(this._getTile.bind(this));
  }

  getFilePath(lat, lon) {
    const latFileName =
        `${lat < 0 ? 'S' : 'N'}${String(Math.abs(lat)).padStart(2, '0')}`;
    const lonFileName =
        `${lon < 0 ? 'W' : 'E'}${String(Math.abs(lon)).padStart(3, '0')}`;
    const fileName = `${latFileName}${lonFileName}.hgt.gz`;
    return `${latFileName}/${fileName}`;
  }

  async getElevation(latLon) {
    const tile =
        await this.getTile(Math.floor(latLon[0]), Math.floor(latLon[1]));
    return tile.getElevation(latLon);
  }
}

class FileTileSet extends TileSet {
  constructor(folder, options) {
    super(options);
    this._folder = folder;
  }

  async _getTile(lat, lon) {
    let stream =
        createReadStream(path.join(this._folder, this.getFilePath(lat, lon)));
    if (this.options.gzip) {
      stream = stream.pipe(createGunzip());
    }
    const tile = await HGT.loadStream(stream, [lat, lon]);
    return tile;
  }
}

class S3TileSet extends TileSet {
  async _getTile(lat, lon) {
    // console.log(`${S3TileSet.baseUrl}/${this.getFilePath(lat, lon)}`);
    let stream = await new Promise(
        resolve =>
            get(`${S3TileSet.baseUrl}/${this.getFilePath(lat, lon)}`, resolve));
    if (this.options.gzip) {
      stream = stream.pipe(createGunzip());
    }
    const tile = await HGT.loadStream(stream, [lat, lon]);
    return tile;
  }
}
S3TileSet.baseUrl = 'https://elevation-tiles-prod.s3.amazonaws.com/skadi';

TileSet.S3TileSet = S3TileSet;
TileSet.FileTileSet = FileTileSet;

module.exports = TileSet;
