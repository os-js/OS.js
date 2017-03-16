#!/bin/bash
#
# Creates an 'electron' build ready for packaging
#

DIR=dist-electron
DIST=${DIR}/dist


rm -rf ${DIR}
mkdir -p ${DIST}

# OS.js client
node osjs build
cp -r dist/*.* ${DIST}

# Electron base
cp -r src/templates/distro/electron/*.* ${DIR}/

# OS.js server and dependencies
cp src/server/*.json ${DIR}/
(cd ${DIR}; npm install)
cp -r src/server/node ${DIR}/node_modules/osjs

# Misc
mkdir -p ${DIR}/vfs/home/demo
