# Requirements
Server runs on Linux, OS X, BSD and Windows.

If you don't want to set up a server and just want to test OS.js in your browser, 
I provide minimalistic [nightly builds](http://osjsv2.0o.no/OS.js-v2-minimal-nightly.zip). 
Please note networking and filesystem functions is disabled here.

## System dependencies

Make sure you have these dependencies installed

* **node** and **npm** (Ubuntu/Debian users: make sure to install the *legacy* package)
* **grunt CLI** (`npm install -g grunt-cli` as admin/sudo. Windows users use "cmd" as *Administrator*)
* Optional: **Git** for the automated installer
* Optional: **java** to compress/minimize sources

You can also use **PHP** with or without a CGI webserver (Like Apache or Lighttpd)

# Installation

## Automated

Simply run `curl -sS http://andersevenrud.github.io/OS.js-v2/installer | sh` if you have the required dependencies.

*Not available for Windows users yet. See instructions below*

## Manual

This only requires a few simple steps. First, make sure you have all the dependencies listed above installer.

Then just clone or download OS.js somewhere and run these commands:

```shell
cd OS.js-v2
npm install
grunt --force
```

Now you're ready to set up a server.

# Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the correct web-server permissions to make filesystem work properly.

Example for Apache on Ubuntu: `sudo chown -R www-data:www-data vfs/`

**Windows users:** dist-dev does not work at the moment because of symlinks not supported

## Node

* Production: `node src/server-node/server.js`
* Developement: `node src/server-node/server.js dist-dev`

## PHP5

## Internal Web-server for PHP 5.4+

* Production: `(cd dist; php -S localhost:8000 ../src/server-php/server.php)`
* Developer: `(cd dist-dev; php -S localhost:8000 ../src/server-php/server.php)`

### Apache

Run `grunt apache-vhost` to generate one (or look in doc/ for example)

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

## Lighttpd

Run `grunt lighttpd-config` to generate one (or look in doc/ for example)

## Nginx

Run `grunt nginx-config` to generate one (or look in doc/ for example)

# Deployment

## Standalone

You can run OS.js in `file://` (locally in browser), but this will disable any server-call and filesystem functions.

Just open `dist/index.html` after you build.

## Vargant

A [Vargant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Just use [this configuration file](https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile).

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
