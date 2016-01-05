#!/bin/bash

## OS.js For Docker
## Builder Version: 1.00

## Introduction
echo "OS.js Image Builder for Docker."
sleep 5

## Prompt user for image name and build image.
echo -n "What would you like to name your image?"
read imagename
echo "Building now."
sleep 3
docker build -t $imagename .
echo "Build Complete"
sleep 1

## Start Container
echo "Starting Docker Container from image called $imagename"
sleep 1
docker start $imagename

## Find IP of container
echo "Finding IP address of built container."
docker inspect --format '{{ .NetworkSettings.IPAddress }}' $(docker ps -q)
echo "Enter this IP address with port 8000 into your browsers address bar."
sleep 1
echo "Have fun."











