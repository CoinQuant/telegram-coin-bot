FROM node:8.4.0-alpine

MAINTAINER destec <catalyst.zhang@gmail.com>
LABEL Description="TelegramCoinBot" Author="destec"

USER root
ENV ENV production
ENV token 433829441:AAG0b2pnSj7QuLOLPm7imABsC8AJqldIF5g
WORKDIR /var/tcb
COPY . /var/tcb
RUN cd /var/tcb \
  && apk update \
  && apk upgrade \
  && apk add --no-cache git
  && npm install --production

CMD npm start