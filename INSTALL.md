# Requirements
Server runs on Linux, OS X, BSD and Windows.

If you don't want to set up a server and just want to test OS.js in your browser, 
I provide minimalistic [nightly builds](http://andersevenrud.github.io/OS.js-v2-nightly.zip). 
Please note networking and filesystem functions is disabled here.

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

## Standalone

You can run OS.js in `file://` (locally in browser), but this will disable any server-call and filesystem functions.

Just open `dist/index.html` after you build.

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

You should now be able to access `http://localhost:8080` and see the OS.js desktop.

## X11

OS.js can run as a *X11* Desktop. Slim login manager theme is included.

*This is very experimental and has only been tested on a bare-bones Ubuntu installation*

```
# Expects you to have a user named 'osjs' with sudo permissions

$ sudo apt-get install nodejs virtualbox-x11 npm libwebkit-dev ligbwebkitgtk-dev build-essential
$ git clone https://github.com/andersevenrud/OS.js-v2.git OS.js
$ cd OS.js
$ sudo npm install -g grunt-cli
$ npm install
$ grunt
$ sudo cp -rv vendor/system-image/* /
$ sudo /etc/init.d/osjs start
```

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
