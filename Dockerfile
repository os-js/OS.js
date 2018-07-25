#
# OS.js - JavaScript Cloud/Web Desktop Platform
#
# Copyright (c) 2011-2018, Anders Evenrud <andersevenrud@gmail.com>
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# @author  Anders Evenrud <andersevenrud@gmail.com>
# @licence Simplified BSD License
#

# THIS IS ONLY INTENDED FOR DEVELOPMENT USAGE

# Build: docker build -t username/osjs:dev
# Usage: docker run --user $(id -u):$(id -g) username/osjs:dev
# Using docker-compose is recommended
# You can freely modify this file

FROM node:10

# Default Environment
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Install system dependencies
RUN npm install -g nodemon

# Working area
WORKDIR /usr/src/osjs

# Copy our npm setup
COPY . .

# Install dependencies
RUN NODE_ENV=development npm install

# Install OS.js packages
RUN npm install \
  @osjs/standard-theme \
  @osjs/calculator-application \
  @osjs/draw-application \
  @osjs/htmlviewer-application \
  @osjs/musicplayer-application \
  @osjs/preview-application \
  @osjs/textpad-application

# Build OS.js
RUN npm run package:discover && \
    npm run build

# Start the node server
EXPOSE 8000

CMD ["npm", "run", "serve"]
