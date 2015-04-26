# Requirements
Server runs on Linux, OS X, BSD and Windows.

## System dependencies

Make sure you have these dependencies installed

* **node** and **npm** (Ubuntu/Debian users: make sure to install the *legacy* package)
* **grunt CLI** (`npm install -g grunt-cli` as admin/sudo)
* Optional: **Git** for the automated installer
* Optional: **java** to compress/minimize sources

You can also use **PHP** with or without a CGI webserver (Like Apache or Lighttpd)

# Installation

## Automated

Simply run `curl -sS http://andersevenrud.github.io/OS.js-v2/installer | sh` if you have the required dependencies.

[Not available for Windows users at the moment](https://github.com/andersevenrud/OS.js-v2/issues/94), see manual instructions below.

## Manual

This only requires a few simple steps

```shell
# Clone repository
git clone https://github.com/andersevenrud/OS.js-v2.git
cd OS.js-v2

# Or alternatively download the latest zip
#wget https://github.com/andersevenrud/OS.js-v2/archive/master.zip
#unzip master.zip
#cd OS.js-v2-master

# Install node.js packages
sudo npm install -g grunt-cli # Windows users, run cmd as admin to do this
npm install

# Build OS.js
grunt
```

# Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache on Ubuntu: `sudo chown -R www-data:www-data vfs/`

## PHP5 on Apache

See `doc/apache.conf` for an example

Or run `grunt apache-vhost` to generate one

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

*This has not been tested on Windows, but is probably working with a WAMP stack*

## PHP5 on Lighttpd

See `doc/lighttpd.conf` for an example

Or run `grunt lighttpd-config` to generate one

## PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Production dist: `(cd dist; php -S localhost:8000 ../src/server-php/server.php)`
* Developer dist: `(cd dist-dev; php -S localhost:8000 ../src/server-php/server.php)`

## Node.js

* Production dist: `node src/server-node/server.js`
* Developer dist: `node src/server-node/server.js dist-dev`

[dist-dev does not currently work on Windows platforms](https://github.com/andersevenrud/OS.js-v2/issues/94)

## Vargant

A [Vargant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Requires VirtualBox and Vargant installed

```

# Alternative 1:

$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
$ vagrant up

# Alternative 2:

$ mkdir ~/OS.js && cd ~/OS.js
$ wget https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile
$ vagrant up


```

You should now be able to access ```http://localhost:8080``` and see the OS.js desktop.

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
