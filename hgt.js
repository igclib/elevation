const {readFile} = require('fs');
const {promisify} = require('util');

const asyncReadFile = promisify(readFile);

function avg(v1, v2, f) {
  return v1 + (v2 - v1) * f;
}

function bufferStream(stream) {
  return new Promise(resolve => {
    const bufs = [];
    stream.on('data', d => {
      bufs.push(d);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(bufs));
    });
  });
}

class HGT {
  constructor(buffer, swLatLon, options) {
    this._buffer = buffer;
    this._swLatLon = swLatLon;

    this.options = Object.assign({}, {interpolation: HGT.bilinear}, options);

    if (buffer.length === 12967201 * 2) {
      this._resolution = 1;
      this._size = 3601;
    } else if (buffer.length === 1442401 * 2) {
      this._resolution = 3;
      this._size = 1201;
    } else {
      throw new Error(
          'Unknown tile format (1 arcsecond and 3 arcsecond supported).');
    }
  }

  static async loadFile(path, swLatLon, options) {
    const buffer = await asyncReadFile(path);
    return new HGT(buffer, swLatLon, options);
  }

  static async loadStream(stream, swLatLon, options) {
    const buffer = await bufferStream(stream);
    return new HGT(buffer, swLatLon, options);
  }

  static nearestNeighbour(row, col) {
    return this._rowCol(Math.round(row), Math.round(col));
  }

  static bilinear(row, col) {
    const rowLow = Math.floor(row);
    const rowHi = rowLow + 1;
    const rowFrac = row - rowLow;
    const colLow = Math.floor(col);
    const colHi = colLow + 1;
    const colFrac = col - colLow;
    const v00 = this._rowCol(rowLow, colLow);
    const v10 = this._rowCol(rowLow, colHi);
    const v11 = this._rowCol(rowHi, colHi);
    const v01 = this._rowCol(rowHi, colLow);
    const v1 = avg(v00, v10, colFrac);
    const v2 = avg(v01, v11, colFrac);

    // console.log('row = ' + row);
    // console.log('col = ' + col);
    // console.log('rowLow = ' + rowLow);
    // console.log('rowHi = ' + rowHi);
    // console.log('rowFrac = ' + rowFrac);
    // console.log('colLow = ' + colLow);
    // console.log('colHi = ' + colHi);
    // console.log('colFrac = ' + colFrac);
    // console.log('v00 = ' + v00);
    // console.log('v10 = ' + v10);
    // console.log('v11 = ' + v11);
    // console.log('v01 = ' + v01);
    // console.log('v1 = ' + v1);
    // console.log('v2 = ' + v2);

    return avg(v1, v2, rowFrac);
  }

  getElevation(latLon) {
    const size = this._size - 1;
    const ll = latLon;
    const row = (ll[0] - this._swLatLon[0]) * size;
    const col = (ll[1] - this._swLatLon[1]) * size;

    if (row < 0 || col < 0 || row > size || col > size) {
      throw new Error(
          'Latitude/longitude is outside tile bounds (row=' + row +
          ', col=' + col + '; size=' + size);
    }

    return this.options.interpolation.call(this, row, col);
  }

  _rowCol(row, col) {
    const size = this._size;
    const offset = ((size - row - 1) * size + col) * 2;

    return this._buffer.readInt16BE(offset);
  }
}

module.exports = HGT;
