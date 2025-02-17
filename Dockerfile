FROM node:10

COPY . /app
WORKDIR /app
RUN yarn install

ENV TILE_SET_CACHE 128
ENV TILE_SET_PATH /app/data
ENV MAX_POST_SIZE 5000kb

EXPOSE 4000

HEALTHCHECK CMD curl --fail http://localhost:4000/status || exit 1

CMD ["yarn", "run", "start"]
