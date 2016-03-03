# Installation instructions

Server runs on Linux, OS X, BSD and Windows.

Installation is done in a few simple steps and only takes a minute to get running.

For more general information look at the [README](README.md) file or in the [official documentation](http://os.js.org/doc/).

I have also made a [simplified installation guide](http://os.js.org/doc/manuals/man-install.html) so you don't have to read this entire thing.

#### Table of Contents

* [Dependencies](#dependencies)
* Installation methods
  1. Automated
    * [*NIX](#automated)
    * [Windows](#automated-1)
  2. Manual
    * [*NIX](#manual)
    * [Windows](#manual-1)
  3. Containers and Virtual Machines
    * [Vagrant](#vagrant)
    * [Docker](#docker)
    * [NW.js](#nwjs)
    * [X11](#x11)
  4. Single-board-computers
    * [Raspberry PI](#raspberry-pi)
    * [Arduino](#arduino)
    * [Intel Edison](#intel-edison)
* [Running](#running)
  2. [Node](#node)
  3. PHP
    * [Apache](#apache)
    * [Lighttpd](#lighttpd)
    * [Nginx](#nginx)
    * [WAMP](#wamp)
* [Setting up optional features](#setting-up-optional-features)

# Dependencies

You just need **node** and **npm**. Install them with your package manager or download the [official installer](https://nodejs.org).

**Debian\Ubuntu:** Also install package `nodejs-legacy`.

# Installation

To easily apply updates and other changes, I recommend using **git** to download instead of using a zip-file/automated installer.

If you install npm packages without `--production` parameter, you need to install mocha `sudo npm install -g mocha`

## *NIX

### Automated

Run `curl -sS http://os.js.org/installer | sh`.

### Manual

```shell
$ sudo npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/os-js/OS.js.git
$ cd OS.js
$ npm install --production
$ grunt
```

## Windows

### Automated

Download and run http://os.js.org/installer.exe.

### Manual

[Official video instruction on YouTube](https://www.youtube.com/watch?v=Cj3OdxTdGGc)

Run `cmd` as *Administrator* (important)!

```shell
$ npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/os-js/OS.js.git
$ cd OS.js
$ npm install --production

# This is required to make the Development Environment work, but is optional.
$ bin\create-windows-symlinks

$ grunt --force
```

## Containers and Virtual Machines

### Vagrant

See [Vagrant.md](https://github.com/os-js/OS.js/blob/master/doc/Vagrant.md).

### Docker

See [Docker.md](https://github.com/os-js/OS.js/blob/master/doc/Docker.md).

### NW.js

See [build-nw.md](https://github.com/os-js/OS.js/blob/master/doc/build-nw.md).

### X11

See [build-x11.md](https://github.com/os-js/OS.js/blob/master/doc/build-x11.md).

## Single-board-computers

OS.js runs on all platforms, but there are some documentation for spesific platforms:

### Raspberry PI

See [platform-raspi.md](https://github.com/os-js/OS.js/blob/master/doc/platform-raspi.md).

### Arduino

See [platform-arduino.md](https://github.com/os-js/OS.js/blob/master/doc/platform-arduino.md).

### Intel Edison

See [platform-edison.md](https://github.com/os-js/OS.js/blob/master/doc/platform-edison.md).

# Running

*If you built OS.js using a container (above) you can skip this.*

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

After you have started a server, simply navigate to http://localhost:8000 (port 8000 is default).

## Node

This is the prefered method for running OS.js.

See [server-node.md](https://github.com/os-js/OS.js/blob/master/doc/server-node.md) for more information about running on Node.

```
# Start production server (linux or windows)
./bin/start-dist.sh or bin\win-start-dist

# Start development server (linux or windows)
./bin/start-dev.sh or bin\win-start-dev
```

## PHP5

See [server-php.md](https://github.com/os-js/OS.js/blob/master/doc/server-php.md) for how to set it up on your server.

```
# Start production server
(cd dist; php -S 0.0.0.0:8000 ../src/server/php/server.php)

# Start development server
(cd dist-dev; php -S 0.0.0.0:8000 ../src/server/php/server.php)
```

# Setting up optional features

* [Add packages](http://os.js.org/doc/manuals/man-package-manager.html)
* [Google API and Google Drive](http://os.js.org/doc/manuals/man-google-api.html)
* [Windows Live API and OneDrive](http://os.js.org/doc/manuals/man-windows-live-api.html)
* [Dropbox](http://os.js.org/doc/manuals/man-dropbox.html)
* [Broadway](http://os.js.org/doc/manuals/man-broadway.html)
* [ZIP support](http://os.js.org/doc/manuals/man-zip.html)

