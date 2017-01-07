############################################
## Docker Image for the  OS.js Project    ##
## Dockerfile created by junland (Github) ##
## Maintained by andersevenrud            ##
############################################

FROM ubuntu:xenial
MAINTAINER andersevenrud
USER root

RUN apt-get -y update
RUN apt-get -y install git npm nodejs-legacy

RUN git clone https://github.com/os-js/OS.js.git
RUN npm install -g supervisor
RUN cd OS.js/

WORKDIR OS.js/
RUN npm install --production
RUN node osjs build

CMD ./bin/start-dev.sh
EXPOSE 8000
