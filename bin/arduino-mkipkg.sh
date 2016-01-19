#!/bin/bash
#
# OS.js - JavaScript Operating System
#
# Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
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

#REV=`git log --pretty=format:'%h' -n 1`
REV=`git rev-list HEAD --count`
ARCH="ar71xx"
VERSION="2.0.0-build$REV"

PKGNAME="arduinos_${VERSION}_${ARCH}.ipk"
SRCDIR=".arduino/build"
OUTDIR=".arduino"

# Create package files
mkdir -p $OUTDIR/data/usr/lib/lua/osjs
mkdir -p $OUTDIR/data/osjs
mkdir -p $OUTDIR/ipkg

cp -r $SRCDIR/lib/* $OUTDIR/data/usr/lib/lua/
cp -r $SRCDIR/bin $OUTDIR/data/osjs/
cp -r $SRCDIR/dist $OUTDIR/data/osjs/
cp -r $SRCDIR/AUTHORS $OUTDIR/data/osjs/
cp -r $SRCDIR/README $OUTDIR/data/osjs/
cp -r $SRCDIR/settings.json $OUTDIR/data/osjs/

# Create control file
cp src/templates/arduino/ipkg-control $OUTDIR/ipkg/control_tmpl
# adding custom scripts
cp src/templates/arduino/post* $OUTDIR/ipkg
cp src/templates/arduino/prerm $OUTDIR/ipkg
awk '{gsub("ARCH", "'"$ARCH"'", $0); print }' $OUTDIR/ipkg/control_tmpl | awk '{gsub("VER", "'"${VERSION}"'", $0); print }' > $OUTDIR/ipkg/control

# Create control file
tar -C $OUTDIR/ipkg -czf $OUTDIR/control.tar.gz ./control ./prerm ./postinst ./postinst-pkg ./postrm

# Create data image
tar -C $OUTDIR/data -czf $OUTDIR/data.tar.gz ./osjs ./usr

# Create debian binary file
echo "2.0" > $OUTDIR/debian-binary

# Create ipkg
tar -C $OUTDIR -cz ./debian-binary ./data.tar.gz ./control.tar.gz > $OUTDIR/$PKGNAME

# Clean up
rm -rf $OUTDIR/ipkg
rm -rf $OUTDIR/data
rm $OUTDIR/debian-binary
rm $OUTDIR/data.tar.gz
rm $OUTDIR/control.tar.gz
