FROM node:12-alpine

COPY ./deploy /kgDsPrv

WORKDIR /kgDsPrv

RUN npm i

ENTRYPOINT [ "node", "server.js" ]