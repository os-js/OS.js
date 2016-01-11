#!/bin/bash

# Make sure it is executed from root path
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $(dirname $DIR)

node src/server/node/server.js
