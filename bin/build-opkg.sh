#!/bin/bash
#
# This script creates an `ipkg` file ready for deployment
#

NAME=$1
VERSION=$2
ARCH=$3
TEMPLATE=$4

if [ -z $ARCH ]; then
  echo "Missing architechture argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $VERSION ]; then
  echo "Missing version argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $NAME ]; then
  echo "Missing name argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi
if [ -z $TEMPLATE ]; then
  echo "Missing template argument"
  echo "usage: build-opkg.sh <name> <version> <arch> <template>"
  exit 1
fi

echo "[opkg] Preparing..."

./bin/make-packaged.sh $TEMPLATE

PKGNAME="${NAME}_${VERSION}_${ARCH}.ipk"
SRCDIR=".build/output"
OUTDIR=".build/opkg"

rm -rf $OUTDIR

if [ "$TEMPLATE" == "arduino" ]; then
  (cd src/conf; ln -sf ../templates/conf/500-arduino 500-arduino.json)
fi

echo "[opkg] Building..."

#
# Create package files
#
mkdir -p $OUTDIR/ipkg
mkdir -p $OUTDIR/data/osjs
if [ "$TEMPLATE" == "arduino" ]; then
  mkdir -p $OUTDIR/data/usr/lib/lua/osjs
fi
cp -r $SRCDIR/* $OUTDIR/data/osjs/

echo "[opkg] Packing..."

#
# Create image(s)
#

F=$(readlink -f $OUTDIR)
cp src/templates/opkg/$TEMPLATE/* $OUTDIR/ipkg/
awk '{gsub("ARCH", "'"$ARCH"'", $0); print }' $OUTDIR/ipkg/control_tmpl | awk '{gsub("VER", "'"${VERSION}"'", $0); print }' > $OUTDIR/ipkg/control
(cd $OUTDIR/ipkg; tar -czf $F/control.tar.gz *)
(cd $OUTDIR/data; tar -czf $F/data.tar.gz *)
echo $VERSION > $OUTDIR/debian-binary
tar -C $OUTDIR -cz ./debian-binary ./data.tar.gz ./control.tar.gz > $OUTDIR/$PKGNAME

#
# Clean up
#

rm -rf $OUTDIR/ipkg
rm -rf $OUTDIR/data
rm $OUTDIR/debian-binary
rm $OUTDIR/data.tar.gz
rm $OUTDIR/control.tar.gz

echo "[opkg] Done :)"

exit 0
