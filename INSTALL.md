# Requirements
* **lessc**
* **java** if you want to build compressed dists

# Installation
Installation only requires a few small steps.

## 1: Pull code

Run `git pull --recursive https://github.com/andersevenrud/OS.js-v2.git`

Or if you do not have Git see this wiki article: [Installation without Git](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration#installation-without-git)

## 2: Build OS.js

Simply run `make`

## 3: Setting up a web-server

Make sure the VFS directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache: `sudo chown -R www-data:www-data vfs/*`

### PHP5 With Apache

See `doc/apache.conf` for an example

* Make sure .htaccess is allowed
* Make sure mod_rewrite is enabled

### PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Run `make php-webserver`
  * Or `(cd dist; php -S localhost:8000 ../src/server-php/webserver.php)`

### Node.js
*Please note that the node server is not finished yet, but is working for development purposes*

* Install dependencies: `npm install node-fs-extra` (only required for filesystem API support)
* Run `make node-webserver`
  * Or `node src/server-node/server.js` for build dist
  * Or `node src/server-node/server.js dist-dev` for developers

### Lighttpd

See `doc/lighttpd.conf` for an example

# Links

* [Installation and configuration help](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration)
