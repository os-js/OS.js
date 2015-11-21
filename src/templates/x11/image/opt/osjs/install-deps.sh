#!/bin/bash
#
# Dependency installation script
#
# Copyright (c) 2013 Anders Evenrud <andersevenrud@gmail.com>
# Released under the 2-clause BSD license.
#

if [ -f /usr/bin/apt-get ]; then
  apt-get install -y xorg xauth xcursor-themes
  apt-get install -y alsa-utils pulseaudio pulseaudio-module-x11 consolekit dbus dbus-x11
  apt-get install -y gstreamer0.10-alsa gstreamer0.10-pulseaudio gstreamer0.10-plugins-good gstreamer0.10-plugins-base
  apt-get install -y libwebkitgtk-3.0 libwebkitgtk-3.0-dev
elif [ -f /usr/bin/emerge ]; then
  emerge xorg-server xauth xcursor-themes alsa pulseaudio libwebkitgtk consolekit dbus gstreamer
fi

