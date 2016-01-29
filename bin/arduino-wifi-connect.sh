#!/bin/sh
#
# A simple script for setting wifi connection
#
# Arguments:
#   <ssid> wireless network name
#   <encryption> encryption type
#   <key> key to access wireless network
#   <netrestart> do network restart '1' or not '0'
#

/sbin/uci set  network.lan=interface
/sbin/uci set  network.lan.proto=dhcp
/sbin/uci delete  network.lan.ipaddr
/sbin/uci delete  network.lan.netmask
/sbin/uci set wireless.@wifi-iface[0].mode=sta
/sbin/uci set wireless.@wifi-iface[0].ssid="$1"
/sbin/uci set wireless.@wifi-iface[0].encryption="$2"
/sbin/uci set wireless.@wifi-iface[0].key="$3"
/sbin/uci commit network
/sbin/uci commit wireless

if [ -n $4 ] && [ $4 = 1 ]; then
    /sbin/wifi
    /etc/init.d/network restart
fi