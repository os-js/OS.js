# Requirements
Server runs on Linux, OS X, BSD and Windows.

## System dependencies

Make sure you have these dependencies installed

* **GNU Make** for non-Windows users
* **nodejs** and **npm** (Ubuntu/Debian users: make sure to install the *legacy* package)
* Optional: **Git** for the automated installer
* Optional: **java** to compress/minimize sources

You can also use **PHP** with or without a CGI webserver (Like Apache or Lighttpd)

# Installation

## Windows

To install OS.js on Windows platforms you have to download the **windows** branch and manually install.
This is experimental, but working. Look at the INSTALL instructions in that branch for more information.

## Automated

Simply run `curl -sS http://andersevenrud.github.io/OS.js-v2/installer | sh`.

## Manual

This only requires a few simple steps

```shell
# Clone repository
git pull https://github.com/andersevenrud/OS.js-v2.git
cd OS.js-v2

# Or alternatively download the latest zip
#wget https://github.com/andersevenrud/OS.js-v2/archive/master.zip
#unzip master.zip
#cd OS.js-v2-master

# Install node.js packages
npm install

# Build OS.js
make
```

# Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache on Ubuntu: `sudo chown -R www-data:www-data vfs/`

## PHP5 on Apache

See `doc/apache.conf` for an example

Or run `./obt apache-vhost` to generate one

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

## PHP5 on Lighttpd

See `doc/lighttpd.conf` for an example

Or run `./obt lighttpd-config` to generate one

## PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Production dist: `(cd dist; php -S localhost:8000 ../src/server-php/server.php)`
* Developer dist: `(cd dist-dev; php -S localhost:8000 ../src/server-php/server.php)`

## Node.js

* Production dist: `node src/server-node/server.js`
* Developer dist: `node src/server-node/server.js dist-dev`

## Vargant

A [Vargant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

[More information here](https://github.com/andersevenrud/OS.js-v2/blob/master/doc/vargant.md)

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
