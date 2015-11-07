VERSION="2.0.0"
BUILD=`git log --pretty=format:'%h' -n 1`

SRCDIR=".arduino/build"
OUTDIR=".arduino"

mkdir -p $OUTDIR/data/usr/lib/lua/osjs
mkdir -p $OUTDIR/data/opt/osjs
mkdir -p $OUTDIR/ipkg

cp src/templates/ipkg-control $OUTDIR/ipkg/control_tmpl
cp -r $SRCDIR/lib/* $OUTDIR/data/usr/lib/lua/
cp -r $SRCDIR/dist $OUTDIR/data/opt/osjs/
cp -r $SRCDIR/AUTHORS $OUTDIR/data/opt/osjs/
cp -r $SRCDIR/README.md $OUTDIR/data/opt/osjs/
cp -r $SRCDIR/CHANGELOG.md $OUTDIR/data/opt/osjs/
cp -r $SRCDIR/mime.json $OUTDIR/data/opt/osjs/
cp -r $SRCDIR/settings.json $OUTDIR/data/opt/osjs/

exit
awk '{gsub("ARCH", "'"$1"'", $0); print }' $OUTDIR/ipkg/control_tmpl | awk '{gsub("VER", "'"${VERSION}"'", $0); print }' > $OUTDIR/ipkg/control

tar -C $OUTDIR/ipkg -czf $OUTDIR/control.tar.gz ./control
tar -C $OUTDIR/data -czf $OUTDIR/data.tar.gz ./opt
echo "2.0" > $OUTDIR/debian-binary

rm -f $OUTDIR/ipkg/control
rm -rf $OUTDIR/data

tar -C $OUTDIR -cz ./debian-binary ./data.tar.gz ./control.tar.gz > osjs_${VERSION}_${BUILD}.ipk

rm -rf $OUTDIR/ipkg
rm -rf $OUTDIR/data
