FROM node:8-alpine

MAINTAINER destec <destecx@gmail.com>
LABEL Description="Telegram Coin Bot" Author="destec"

USER root
ENV ENV production
ENV telegram_coin_bot_token 433829441:AAG0b2pnSj7QuLOLPm7imABsC8AJqldIF5g
WORKDIR /var/tcb
COPY . /var/tcb
RUN cd /var/tcb \
  && apk update \
  && apk upgrade \
  && apk add --no-cache git \
  && npm install --production

CMD npm start