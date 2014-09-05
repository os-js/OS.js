# Requirements
Server runs on OSX, BSD and Linux (also Windows if you have Cygwin)

## System dependencies

Make sure you have these dependencies installed

* **nodejs** and **npm**
* **lessc** (`sudo npm -g less`)
* **bash**
* **GNU Make**

_To build compressed/minimized versions java is required because of vendor libraries_

# Installation
Installation only requires a few small steps.

## 1: Download

Download the latest source from github or clone with git using:

`git pull https://github.com/andersevenrud/OS.js-v2.git`

## 2: Build OS.js

Simply run `make`

## 3: Setting up a web-server

Make sure the _VFS_ directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache: `sudo chown -R www-data:www-data vfs/`

### PHP5 on Apache

See `doc/apache.conf` for an example

Or run `make apache-vhost` to generate one

### PHP5 on Lighttpd

See `doc/lighttpd.conf` for an example

Or run `make lighttpd-config` to generate one

### PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Production dist: `(cd dist; php -S localhost:8000 ../src/server-php/server.php)`
* Developer dist: `(cd dist-dev; php -S localhost:8000 ../src/server-php/server.php)`

### Node.js

* Install dependencies: `npm install node-fs-extra formidable`
* Production dist: `node src/server-node/server.js`
* Developer dist: `node src/server-node/server.js dist-dev`

# Links

* [Installation and configuration help](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration)
