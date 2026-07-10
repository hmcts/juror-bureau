FROM hmctsprod.azurecr.io/base/node:22-alpine as base
COPY package.json yarn.lock ./

FROM base as build
USER root
RUN apk add autoconf=2.72-r1 automake=1.18.1-r0 gcc=15.2.0-r2 make=4.4.1-r3 g++=15.2.0-r2 zlib-dev=1.3.2-r0 nasm=2.16.03-r0
USER hmcts
COPY --chown=hmcts:hmcts . .
RUN yarn install

FROM base as runtime
ENV NODE_ENV=production
COPY --from=build $WORKDIR ./
USER hmcts
EXPOSE 3000
RUN yarn build:prod
CMD ["node", "./dist/server/index.js"]
