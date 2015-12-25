#!/bin/sh
#
# A simple script for getting wifi connection info
#

ap=`iw dev wlan0 link | grep "Connected to " | awk '{print $3}'`
security="<none>"
ssid="<none>"
signal="0dBm"

if [[ "$ap" == "" ]]; then
        ap="00:00:00:00:00:00"
else
        ssid=`iw dev wlan0 link | grep "SSID: " | cut -d ":" -f2`
        signal=`iw dev wlan0 link | grep "signal: " | cut -d ":" -f2` | sed 's/ //g'
fi

echo $ap $ssid $security $signal

