############################################
## Docker Image for the  OS.js-v2 Project ##
## Dockerfile created by junland (Github) ##
############################################

## Pull Docker image using Ubuntu 14.04 LTS ##
FROM ubuntu:trusty
MAINTAINER junland ##You can put your own name.##
USER root

## Initial update of image ##
RUN apt-get -y update

## Install dependencies and build tools. ##
RUN apt-get install -y git
RUN apt-get install -y npm
RUN apt-get install -y nodejs-legacy

## Clone the Repo and install grunt ##
RUN git clone https://github.com/andersevenrud/OS.js-v2.git
RUN npm install -g grunt-cli
RUN cd OS.js-v2/

## Install and Compile OS.js ##
WORKDIR OS.js-v2/
RUN npm install
RUN grunt

## Start Application and Expose Port ##
## Note: you can change 'start-dev.sh' (Development Version) to 'start-dist.sh' (Production Version) ##

CMD ./bin/start-dev.sh
EXPOSE 8000
