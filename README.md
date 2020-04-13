# Elevation service

Self-hosted elevation service that works with the [terrain data provided by Mapzen and Amazon AWS S3](https://registry.opendata.aws/terrain-tiles/).

## TL;DR

```bash
cp keys_example.js keys.js
HASH=$(echo -n MY_API_KEY | sha256sum | awk '{print $1}')
sed -i "s/API_KEY_1/$HASH/g" keys.js

yarn install
yarn run test
yarn run start
```

## API usage

### Keys

This service requires an API key to answer requests. To set up keys, copy `keys_example.js` as `keys.js`, and add the hash of your keys to the authorized keys array. To generate the hash of your personal key, run

```bash
echo -n MY_API_KEY | sha256sum
```

### Array of coordinates

```bash
# > [[lat_1, lon_1], [lat_2, lon_2], ...]
curl -d '[[51.3, 13.4], [51.4, 13.3]]' -XPOST -H 'Content-Type: application/json' -L "localhost:4000?key=MY_API_KEY"
# < [alt_1, alt_2, ...]
```

### Single coordinate

```bash
curl 'localhost:4000?key=MY_API_KEY&lat=51.3&lon=13.4'
# < alt
```

Run the docker container:

```bash
docer build -t elevation-service .
docker run --rm -v/path/to/data/folder:/app/data -4000:4000 elevation-service
```

## Download data

```bash
aws s3 cp --no-sign-request --recursive s3://elevation-tiles-prod/skadi /path/to/data/folder
```

## Acknowledgements

This service was forked from [racemap/elevation-service](https://github.com/racemap/elevation-service).