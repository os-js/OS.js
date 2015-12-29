#!/bin/bash

# Make sure it is executed from root path
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $(dirname $DIR)

if ! type "supervisor" > /dev/null 2>&1; then
  echo "Starting Node server without a supervisor..."
  node src/server/node/server.js dist-dev
  exit $?
fi

echo "Starting Node server with a supervisor..."
supervisor --watch src/server/node,src/server/settings.json -- src/server/node/server.js dist-dev
