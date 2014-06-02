#!/bin/sh
#
# Example X initialization script (For using XDM, Slim or similar)
#

xsetroot -cursor /usr/share/icons/whiteglass
xsetroot -cursor_name left_ptr
/usr/bin/start-pulseaudio-x11

# Launch the Backend
/usr/local/bin/osjs-user-client &

# Launch the X11 Client
exec /usr/bin/dbus-launch /usr/bin/ck-launch-session /usr/local/bin/osjs-launcher

