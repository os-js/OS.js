#!/bin/bash
#
# Daemon installation script
#
# Copyright (c) 2013 Anders Evenrud <andersevenrud@gmail.com>
# Released under the 2-clause BSD license.
#

if [ "$1" == "uninstall" ]; then
  if [ -f /usr/sbin/update-rc.d ]; then
    update-rc.d -f osjs remove
  elif [ -f /usr/sbin/rc-update ]; then
    rc-update remove osjs
  fi

  rm -rf /etc/init.d/osjs
elif [ "$1" == "install" ]; then
  if [ -f /usr/sbin/update-rc.d ]; then
    cp etc/init.d/osjs-debian /etc/init.d/osjs
    update-rc.d -f osjs defaults 98
  elif [ -f /usr/sbin/rc-update ]; then
    cp etc/init.d/osjs-gentoo /etc/init.d/osjs
    rc-update add osjs default
  fi
fi

exit 0

