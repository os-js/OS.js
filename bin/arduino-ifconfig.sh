#!/bin/sh
#
# Wrapper for getting ifconfig in JSON format
#

unset LASTIFCFG

echo -n "["
for IFACE in $(ls /sys/class/net); do
  if ! [ -z "$LASTIFCFG" ]; then
    echo -n ","
  fi

  IFCFG=$(ifconfig "$IFACE")

  MACADDR=$(echo "$IFCFG" | grep HWaddr | awk '{print $5}')
  ADDRESS=$(echo "$IFCFG" | grep "inet addr" | awk '{print $2}' | awk -F':[[:blank:]]*' '{print $2}')
  BROADCAST=$(echo "$IFCFG" | grep "inet addr" | awk '{print $3}' | awk -F':[[:blank:]]*' '{print $2}')
  NETMASK=$(echo "$IFCFG" | grep "inet addr" | awk '{print $4}' | awk -F':[[:blank:]]*' '{print $2}')

  echo "{"
  echo "  \"iface\": \"$IFACE\","
  echo "  \"mac\": \"${MACADDR}\","
  echo "  \"ip\": \"${ADDRESS}\","
  echo "  \"broadcast\": \"${BROADCAST}\","
  echo "  \"netmask\": \"${NETMASK}\""
  echo -n "}"

  LASTIFCFG=$IFCFG
done
echo -n "]"

