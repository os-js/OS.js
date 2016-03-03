# Install OS.js as a Linux Distribution

OS.js can run as a **X11** Desktop.

*This was tested using ubuntu-14.04.3-server-amd64.iso*

``` Shell

#
# Install dependencies
#

$ sudo apt-get install nodejs nodejs-legacy npm virtualbox-guest-x11
$ sudo apt-get install xorg xauth xcursor-themes consolekit dbus dbus-x11 libwebkitgtk-3.0 libwebkitgtk-3.0-dev ligbwebkitgtk-dev 
$ sudo apt-get install alsa-utils pulseaudio pulseaudio-module-x11 gstreamer0.10-alsa gstreamer0.10-pulseaudio gstreamer0.10-plugins-good gstreamer0.10-plugins-base
$ sudo apt-get install build-essential libpam0g-dev libgtk-3-dev
$ sudo npm install -g grunt-cli

#
# Make image
#

$ git clone https://github.com/os-js/OS.js.git
$ cd OS.js
$ ./bin/build-debian-image.sh

#
# Install
#

$ sudo dpkg -i <IMAGE NAME>.deb
$ sudo update-rc.d -f osjs-server defaults 98
$ sudo update-rc.d -f osjs-client defaults 99

```

Os.js will now start every time you reboot

