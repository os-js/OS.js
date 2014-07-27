# Requirements
Make sure you have these dependencies installed.

* **nodejs**
* **lessc** (`sudo npm -g less`)
* **bash**
* **GNU Make**

To build compressed/minimized versions java is required because of YUI tools used.

# Installation
Installation only requires a few small steps.

## 1: Pull code

Download the latest source from github or clone with git using:

`git pull https://github.com/andersevenrud/OS.js-v2.git`

## 2: Build OS.js

Simply run `make`

## 3: Setting up a web-server

Make sure the VFS directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache: `sudo chown -R www-data:www-data vfs/*`

### PHP5 on Apache

See `doc/apache.conf` for an example

* Make sure .htaccess is allowed
* Make sure mod_rewrite is enabled

### PHP5 on Lighttpd

See `doc/lighttpd.conf` for an example

### PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Production dist: `(cd dist; php -S localhost:8000 ../src/server-php/server.php)`
* Developer dist: `(cd dist-dev; php -S localhost:8000 ../src/server-php/server.php)`

### Node.js
*Please note that the node server is not finished yet, but is working for development purposes*

* Install dependencies: `npm install node-fs-extra formidable`
* Production dist: `node src/server-node/server.js`
* Developer dist: `node src/server-node/server.js dist-dev`

# Links

* [Installation and configuration help](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration)
