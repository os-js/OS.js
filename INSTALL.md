# Installation instructions

Server runs on Linux, OS X, BSD and Windows.


If you just want to check out OS.js without building or running a server, I provide a minimalistic [nightly build](http://osjsv2.0o.no/OS.js-v2-minimal-nightly.zip).
Please note that it might be unstable, also Networking and Filesystem functions is disabled.

# Dependencies

* **node** and **npm**
  * Ubuntu/Debian: make sure to install the *legacy* package
  * Windows: Just download the official installer from https://nodejs.org/
* Optional
  * **Git** for the automated installer and/or updating changes easily
  * **PHP** if you don't want to run Node server
  * **Web server** if you want to run with Apache, Lighttpd, NGINX or similar

# Installation

**Make sure you have dependencies installed before beginning**

## Automated

### NIX

Simply run `curl -sS http://os.js.org/installer | sh`

### Windows

Download and run `http://os.js.org/installer.exe`.

### Vagrant

A [Vagrant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Just use [this configuration file](https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile).

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

[![asciicast](https://asciinema.org/a/8t4w7pgzsq0xdwo3bhdnm8dpx.png)](https://asciinema.org/a/8t4w7pgzsq0xdwo3bhdnm8dpx)

If building was successful, you can now start up a server.

## Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

**Windows users:** dist-dev does not work at the moment because it relies on symbolic links intended for POSIX type systems.

## Standalone

You can run OS.js in `file://` (locally in browser), but this will disable any server-call and filesystem functions.

Just open `dist/index.html` after you build.

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

## Webhost

If you have a "webhost" (or "webhotel") with ex. cPanel without shell access (or no node support), you can run OS.js, but
has to be built on another computer, then transfered over (just follow the instructions above).

The only downside here is that you'd have to run from /OS.js-v2/dist/ without doing modifications to the setup.

## X11

OS.js can run as a *X11* Desktop.

Full documentation [here](https://github.com/andersevenrud/OS.js-v2/blob/master/doc/X11.md).

# Adding additional applications

You can find instructions [in this manual](http://os.js.org/doc/manuals/man-package-manager.html).

# Update instructions

Download and extract the latest zip, or use the preferred method (git):

```
$ git pull

# Build all changes
$ grunt --force

# Or just core and packages
$ grunt --force core packages

```

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
