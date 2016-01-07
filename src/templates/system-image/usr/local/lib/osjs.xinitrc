#!/bin/sh
#
# Default X initialization script (For built-in login manager)
#
export DISPLAY=":0.0"
xsetroot -cursor /usr/share/icons/whiteglass
xsetroot -cursor_name left_ptr
/usr/bin/start-pulseaudio-x11
exec /usr/bin/dbus-launch /usr/bin/ck-launch-session /usr/local/bin/osjs-launcher
