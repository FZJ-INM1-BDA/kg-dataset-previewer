FROM node:12-alpine

COPY ./deploy /kgDsPrv
COPY ./common /common

WORKDIR /kgDsPrv

RUN npm i

ENTRYPOINT [ "node", "server.js" ]