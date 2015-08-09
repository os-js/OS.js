# Installation instructions

Server runs on Linux, OS X, BSD and Windows.

# Dependencies

You just need **node** and **npm**. Install them with your package manager or download the [official installer](https://nodejs.org).

**Debian\Ubuntu:** Also install package `nodejs-legacy`.

# Installation

To easily apply updates and other changes, I recommend using **git** to download instead of using a zip-file/automated installer.

## NIX

### Automated

Run `curl -sS http://os.js.org/installer | sh`.

### Manual

```shell
$ sudo npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
$ npm install
$ grunt
```

## Windows

### Automated

Download and run http://os.js.org/installer.exe.

### Manual

Run `cmd` as *Administrator* (important)!

```shell
$ npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
$ npm install

# This is required to make the Development Environment work, but is optional.
$ bin\create-windows-symlinks

$ grunt --force
```

## Vagrant

A [Vagrant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Just use [this configuration file](https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile).

# Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

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

# Setting up features

I have documentation on how to set up optional core features:

* [Google API and Google Drive](http://os.js.org/doc/manuals/man-google-api.html)
* [Windows Live API and OneDrive](http://os.js.org/doc/manuals/man-windows-live-api.html)
* [Dropbox](http://os.js.org/doc/manuals/man-dropbox.html)
* [Broadway](http://os.js.org/doc/manuals/man-broadway.html)
* [ZIP support](http://os.js.org/doc/manuals/man-zip.html)

# Adding additional applications

You can find instructions [in this manual](http://os.js.org/doc/manuals/man-package-manager.html).

# Update instructions

Download and extract the latest zip, or use the preferred method (git):

```
$ git pull

# Build all changes
$ grunt

# Or just core and packages
$ grunt core packages

```

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
