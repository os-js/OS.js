#!/bin/sh


# Extract arguments

while echo $1 | grep -q ^-; do
    eval $( echo $1 | sed 's/^-//' )=$2
    shift
    shift
done

#
# SYSTEM SETTINGS
#

#if [ -n "$password" ]; then
	# EMPTY - DONE IN LUA SERVER SCRIPT
#fi

if [ -n "$hostname" ]; then
	/sbin/uci set system.@system[0].hostname="$hostname"
	/sbin/uci commit system
fi

if [ -n "$timezone" ]; then
	/sbin/uci set system.@system[0].timezone="$timezone"
	/sbin/uci commit system
fi

if [ -n "$restapi" ]; then
	/sbin/uci set arduino.@arduino[0].secure_rest_api="$restapi"
    /sbin/uci commit arduino
fi


#
# WIFI SETTINGS
#

wifiwasset=false

if [ -n "$wifipassword" ]; then
	/sbin/uci set wireless.@wifi-iface[0].key="$wifipassword"
	wifiwasset=true
fi

if [ -n "$wifissid" ]; then
	/sbin/uci set wireless.@wifi-iface[0].ssid="$wifissid"
	wifiwasset=true
fi

if [ -n "$wifiencryption" ]; then
	/sbin/uci set wireless.@wifi-iface[0].encryption="$wifiencryption"
	wifiwasset=true
fi

if [ "$wifiwasset" = true ]; then
	/sbin/uci set wireless.@wifi-iface[0].mode=sta
	/sbin/uci set  network.lan=interface
	/sbin/uci set  network.lan.proto=dhcp
	/sbin/uci delete  network.lan.ipaddr
	/sbin/uci delete  network.lan.netmask
	/sbin/uci commit network
	/sbin/uci commit wireless
	/sbin/wifi
	# /etc/init.d/network reload
fi

sleep 5
reboot