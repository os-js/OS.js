FROM node:boron-alpine
MAINTAINER osjs

# Install dependencies
RUN apk add --no-cache git
RUN apk add --no-cache bash
RUN apk add --no-cache python
RUN apk add --no-cache make
RUN apk add --no-cache g++
RUN apk add --no-cache mysql-client
RUN apk add --no-cache --virtual .build-deps 

RUN npm install -g supervisor

# Clone OS.js
WORKDIR /
RUN mkdir OS.js
ADD . /OS.js/

# Install OS.js
WORKDIR OS.js/
RUN npm install
RUN node osjs build

# Install Database Storage
RUN npm install sqlite3 mysql
RUN npm install bcrypt --build-from-source

# Run OS.js
CMD ["bash", "bin/docker_install.sh"]
# CMD ["bash", "bin/start.sh"]
EXPOSE 8000