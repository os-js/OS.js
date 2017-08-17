#!/bin/bash
## OS.js For Docker
## Builder Version: 1.10

TAG=$1

if [ -z "$TAG" ]; then
  echo -n "What would you like to name your image (ex: org/pkg)? "
  read TAG
fi

if [ -z "$TAG" ]; then
  echo "You need to supply an image name"
  exit 1
fi

echo "> Making image \"$TAG\""
docker build -t $TAG .
CID=$(docker run -d $TAG)

echo "> Made image $CID"

IPADDR=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' $CID)

echo "> Open your browser on http://$IPADDR:8000"
