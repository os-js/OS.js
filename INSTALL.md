# Installation instructions

Server runs on Linux, OS X, BSD and Windows.

Installation is done in a few simple steps and only takes a minute to get running.

For more general information look at the [README](README.md) file or in the [official documentation](http://os.js.org/doc/).

I have also made a [simplified installation guide](http://os.js.org/doc/manuals/man-install.html) so you don't have to read this entire thing.

#### Table of Contents

* [Dependencies](#dependencies)
* Installation methods
  1. Automated
    * [NIX](#automated)
    * [Windows](#automated-1)
  2. Manual
    * [NIX](#manual)
    * [Windows](#manual-1)
  3. Containers and Virtual Machines
    * [Vagrant](#vagrant)
    * [Docker](#docker)
    * [NW.js](#nwjs)
    * [X11](#x11)
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

## NIX

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

See [NW.md](https://github.com/os-js/OS.js/blob/master/doc/NW.md).

### X11

See [X11.md](https://github.com/os-js/OS.js/blob/master/doc/X11.md).

# Running

*If you built OS.js using a container (above) you can skip this.*

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

After you have started a server, simply navigate to http://localhost:8000 (port 8000 is default).

## Node

Node is the prefered server for OS.js.

### Production (dist)

```
./bin/start-dist.sh` or `bin\win-start-dist
```

### Development (dist-dev)

```
./bin/start-dev.sh` or `bin\win-start-dev
```

You can install [node supervisor](https://github.com/petruisfan/node-supervisor) and the development (dist-dev) server will automatically reload on change.

## PHP5

You can start a server manually with `(cd dist; php -S 0.0.0.0:8000 ../src/server/php/server.php)` or look below for webserver alternatives.

If you have a "webhost" (or "webhotel") with ex. cPanel without shell access (or no node support), you can run OS.js, but has to be built on another computer, then transfered over to the target machine. The only downside here is that you'd have to run from /OS.js/dist/ without doing modifications to the setup (if you don't have access to mod_rewrite to create proxy rules). You can find more info on this [here](https://github.com/os-js/OS.js/blob/master/doc/cpanel-host.md).

*By default PHP uses 'dist' as the default root*

### Apache

Run `grunt apache-vhost` to generate config file (or look in doc/ for example)

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

### Lighttpd

Run `grunt lighttpd-config` to generate config file (or look in doc/ for example)

### Nginx

Run `grunt nginx-config` to generate config file (or look in doc/ for example)

### WAMP

Works fine. Just look up the Apache section above for configuration.

# Setting up optional features

* [Add packages](http://os.js.org/doc/manuals/man-package-manager.html)
* [Google API and Google Drive](http://os.js.org/doc/manuals/man-google-api.html)
* [Windows Live API and OneDrive](http://os.js.org/doc/manuals/man-windows-live-api.html)
* [Dropbox](http://os.js.org/doc/manuals/man-dropbox.html)
* [Broadway](http://os.js.org/doc/manuals/man-broadway.html)
* [ZIP support](http://os.js.org/doc/manuals/man-zip.html)

