#!/bin/bash
# Usage: ./bin/add-package.sh namespace PackageName http://git-repository
set -e

repo=$1
name=$2
src=$3

if [ -z "$repo" ]; then
  echo "You need to supply a repository name"
  exit 1
fi

if [ -z "$name" ]; then
  echo "You need to supply a package name"
  exit 1
fi

if [ -z "$src" ]; then
  echo "You need to supply a source"
  exit 1
fi

#if [ -d "src/packages/$repo/$name" ]; then
#  echo "Package already installed"
#  exit 1
#fi

if [ ! -d "src/packages/$repo/$name" ]; then
  mkdir src/packages/$repo
  git clone --recursive $src src/packages/$repo/$name
fi

(cd src/packages/$repo/$name && npm install)

node osjs config:add --name=repositories --value=$repo
node osjs build:manifest
node osjs build:package --name=$repo/$name

echo "Done :-)"
