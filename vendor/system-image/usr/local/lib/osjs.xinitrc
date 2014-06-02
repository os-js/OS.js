#!/bin/sh
#
# Default X initialization script (For built-in login manager)
#

xsetroot -cursor /usr/share/icons/whiteglass
xsetroot -cursor_name left_ptr
/usr/bin/start-pulseaudio-x11

# Do not launch any node session, daemon handled this

# Launch the X11 Client
exec /usr/bin/dbus-launch /usr/bin/ck-launch-session /usr/local/bin/osjs-launcher

