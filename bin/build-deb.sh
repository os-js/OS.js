#!/bin/bash
#
# Creates a Debian image for OS.js
#

NAME=$1
VERSION=$2

if [ -z $VERSION ]; then
  echo "Missing version argument"
  echo "usage: build-deb.sh <name> <version>"
  exit 1
fi
if [ -z $NAME ]; then
  echo "Missing name argument"
  echo "usage: build-deb.sh <name> <version>"
  exit 1
fi

SRCDIR=".build/output"
OUTDIR=".build/deb"
PKGNAME="${NAME}_${VERSION}"

echo "[deb] Preparing..."

#
# Prepare
#

rm -rf $OUTDIR

(cd src/conf; ln -sf ../templates/conf/500-x11.json 500-x11.json)

npm install nan@1.1.0
npm install authenticate-pam
npm install userid

./bin/make-packaged.sh deb

echo "[deb] Building..."

#
# Create package files
#

# Prepare tree
mkdir -p $OUTDIR/etc/init.d
mkdir -p $OUTDIR/etc/osjs
mkdir -p $OUTDIR/etc/X11
mkdir -p $OUTDIR/opt/osjs
mkdir -p $OUTDIR/usr/local/lib
mkdir -p $OUTDIR/usr/local/bin

cp -r $SRCDIR/* $OUTDIR/opt/osjs/

# Make launcher
(cd src/x11-launcher; make)
mv src/x11-launcher/session-launch $OUTDIR/usr/local/bin/osjs-launcher

# Copy system image
cp -r src/templates/deb/* $OUTDIR/

#
# Debian CONTROL
#
mv $OUTDIR/DEBIAN $OUTDIR/DEBIAN.tmp
mkdir -p $OUTDIR/DEBIAN
mv $OUTDIR/DEBIAN.tmp $OUTDIR/DEBIAN/control

echo "[deb] Packing..."

#
# Create package
#
dpkg-deb --build $PKGNAME

echo "[deb] Done :)"

exit 0
