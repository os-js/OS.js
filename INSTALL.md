# Installation instructions

Server runs on Linux, OS X, BSD and Windows.

If you don't want to set up a server and just want to test OS.js in your browser, 
I provide minimalistic [nightly builds](http://osjsv2.0o.no/OS.js-v2-minimal-nightly.zip). 
Please note networking and filesystem functions is disabled here.

# Dependencies

* **node** and **npm**
  * Ubuntu/Debian: make sure to install the *legacy* package
  * Windows: Just download the official installer from https://nodejs.org/
* Optional
  * **Git** for the automated installer and/or updating changes easily
  * **java** to compress/minimize sources for production builds

You can also use **PHP** with or without a CGI webserver (Like Apache or Lighttpd)

# Installation

**Make sure you have dependencies installed before beginning**

## Automated

### NIX

Simply run `curl -sS http://andersevenrud.github.io/OS.js-v2/installer | sh`

### Windows

Download and run `http://andersevenrud.github.io/OS.js-v2/installer.exe`.


## Manual

This only requires a few simple steps.

```shell
# Install grunt (Windows users: Run "cmd" as Administrator for this without sudo in front)
$ sudo npm install -g grunt-cli

# In this example we clone with git, you can also download the zip-file from github and extract it.
$ git clone https://github.com/andersevenrud/OS.js-v2.git

$ cd OS.js-v2
$ npm install
$ grunt --force
```

If building was successful, you can now start up a server.

## Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

**Windows users:** dist-dev does not work at the moment because it relies on symbolic links intended for POSIX type systems.

## Node

* Production: `./bin/start-node-dist.sh` or `bin\win-start-node-dist`
* Developement: `./bin/start-node-dev.sh` or `bin\win-start-node-dev`

## PHP5

### Internal Web-server for PHP 5.4+

* Production: `./bin/start-php-dist.sh`
* Developement: `./bin/start-php-dev.sh`

### Apache

Run `grunt apache-vhost` to generate config file (or look in doc/ for example)

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

### Lighttpd

Run `grunt lighttpd-config` to generate config file (or look in doc/ for example)

### Nginx

Run `grunt nginx-config` to generate config file (or look in doc/ for example)

### WAMP

Works fine. Just look up the Apache section above for configuration.

# Deployment

## Development

User `dist-dev` folder.

## Production

Use `dist` folder.

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

# Update instructions

Updating the codebase is done with *git*

```

$ git pull

# Build all changes
$ grunt --force

# Or just core and packages
$ grunt --force core packages

```

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
