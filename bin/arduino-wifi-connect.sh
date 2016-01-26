#!/bin/sh
#
# A simple script for setting wifi connection
#
# Arguments: <ssid> <encryption> <key>
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
/sbin/wifi
/etc/init.d/network restart
