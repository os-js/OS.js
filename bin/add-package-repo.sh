#!/bin/sh
# Usage: ./bin/add-package-repo.sh namespace http://git-repository
repo=$1
src=$2

if [ -z "$repo" ]; then
  echo "You need to supply a repository name"
  exit 1
fi

if [ -z "$src" ]; then
  echo "You need to supply a source"
  exit 1
fi

if [ -d "src/packages/$repo" ]; then
  echo "Repo already installed"
  exit 1
fi

git clone --recursive $src src/packages/$repo

for d in "src/packages/$repo/*/"; do
  pushd $d
  npm install
  popd
done

node osjs config:add --name=repositories --value=$repo
node osjs build:manifest
node osjs build:packages -repositories=$reoo
