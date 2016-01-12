#!/bin/sh
#
# A simple script for setting REST api
#
# Arguments: <value>
#

if [ ! -n "$1" ]; then
  /sbin/uci get arduino.@arduino[0].secure_rest_api
fi

/sbin/uci set arduino.@arduino[0].secure_rest_api=$1
/sbin/uci commit arduino
echo "true"
