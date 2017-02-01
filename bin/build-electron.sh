#!/bin/bash
#
# Creates an 'electron' build ready for packaging
#

DIR=dist-electron
DIST=${DIR}/dist-dev


rm -rf ${DIR}
mkdir -p ${DIST}

# OS.js client
node osjs build
cp -r dist-dev/*.* ${DIST}
cp -r src/client ${DIR}/dist-dev/client
cp -r dist/themes ${DIR}/dist-dev/themes

# Packages
mkdir ${DIR}/packages-tmp
for r in `find dist/packages/*/* -maxdepth 1 -type d -prune`; do
  pn=`basename $r`
  rn=`basename $(dirname ${r})`
  mkdir -p ${DIR}/packages-tmp/${rn}
  cp -r src/packages/${rn}/${pn} ${DIR}/packages-tmp/${rn}/${pn}
done

rm -rf ${DIR}/dist-dev/packages
mv ${DIR}/packages-tmp ${DIR}/dist-dev/packages

# Electron base
cp -r src/templates/distro/electron/*.* ${DIR}/

# OS.js server and dependencies
cp src/server/*.json ${DIR}/
(cd ${DIR}; npm install)
cp -r src/server/node ${DIR}/node_modules/osjs

# Misc
cp -r dist/vendor ${DIR}/dist-dev/vendor
mkdir -p ${DIR}/vfs/home/demo
