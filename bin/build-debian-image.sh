#!/bin/bash

NAME="osjs_2.0-07001"
OUTDIR="$NAME"

rm -rf $OUTDIR

# Prepare build
(cd src/conf; ln -sf ../templates/conf/500-x11.json 500-x11.json)

#
# Debian Image
#

# Prepare tree
mkdir -p $OUTDIR/etc/init.d
mkdir -p $OUTDIR/etc/osjs
mkdir -p $OUTDIR/etc/X11
mkdir -p $OUTDIR/opt/osjs
mkdir -p $OUTDIR/opt/osjs/dist
mkdir -p $OUTDIR/opt/osjs/server
mkdir -p $OUTDIR/usr/local/lib
mkdir -p $OUTDIR/usr/local/bin

# Install npm dependencies
npm install
npm install nan@1.1.0
npm install authenticate-pam
npm install userid

# Build
grunt

# Server and Client files
cp -r vendor $OUTDIR/opt/osjs
cp -r src/packages $OUTDIR/opt/osjs/
cp -r src/client $OUTDIR/opt/osjs/
cp -r node_modules $OUTDIR/opt/osjs/server/
cp -r src/server/node/* $OUTDIR/opt/osjs/server/
cp src/server/settings.json $OUTDIR/opt/osjs/
cp src/conf/130-mime.json $OUTDIR/opt/osjs/mime.json
cp dist-dev/blank.css $OUTDIR/opt/osjs/dist/
cp dist-dev/index.html $OUTDIR/opt/osjs/dist/
cp dist-dev/packages.js $OUTDIR/opt/osjs/dist/
cp dist-dev/settings.js $OUTDIR/opt/osjs/dist/
cp dist-dev/faviocon.* $OUTDIR/opt/osjs/dist/
cp dist-dev/osjs-logo.png $OUTDIR/opt/osjs/dist/
(cd $OUTDIR/opt/osjs/dist; ln -sf ../packages packages)
(cd $OUTDIR/opt/osjs/dist; ln -sf ../client client)
cp -r dist/themes $OUTDIR/opt/osjs/dist/
cp -r dist/vendor $OUTDIR/opt/osjs/dist/
rm -rf $OUTDIR/opt/osjs/source/client/themes

# Make launcher
(cd src/x11-launcher; make)
mv src/x11-launcher/session-launch $OUTDIR/usr/local/bin/osjs-launcher

# Copy system image
cp -r src/templates/debian-image/* $OUTDIR/

#
# Debian CONTROL
#
mv $OUTDIR/DEBIAN $OUTDIR/DEBIAN.tmp
mkdir -p $OUTDIR/DEBIAN
mv $OUTDIR/DEBIAN.tmp $OUTDIR/DEBIAN/control

#
# Create package
#
dpkg-deb --build $NAME
