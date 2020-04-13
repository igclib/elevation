const assert = require('assert');

const {FileTileSet} = require('../tileset');

(async function() {
  const tileset = new FileTileSet(__dirname);

  const testLatLon = [51.3, 13.4];
  const result = await tileset.getElevation(testLatLon)

  console.log(result);
  assert(101, result);
})();
