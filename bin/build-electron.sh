#!/bin/bash
#
# Creates an 'electron' build ready for packaging
#

DIR=dist-electron
DIST=${DIR}/dist

rm -rf ${DIR}
mkdir -p ${DIST}

# OS.js client
node osjs clean
node osjs build
cp -r dist/* ${DIST}

# Copy package sources
for f in `find ${DIST}/packages/* -mindepth 1 -maxdepth 1 -type d`; do
  an=$(basename $f)
  rn=$(basename `dirname $f`)
  mkdir -p ${DIR}/src/packages/${rn}
  cp -r src/packages/${rn}/${an} ${DIR}/src/packages/${rn}/${an}
done

# Electron base
cp -r src/templates/distro/electron/*.* ${DIR}/

# OS.js server and dependencies
cp src/server/*.json ${DIR}/
(cd ${DIR}; npm install)
cp -r src/server/node ${DIR}/node_modules/osjs

# Misc
mkdir -p ${DIR}/vfs/home/demo
