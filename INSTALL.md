# Installation instructions

Installation is done in a few simple steps and only takes a minute to get running.

For more general information look at the [README](README.md) file or in the [official documentation](http://os.js.org/doc/).

#### Table of Contents

* [Dependencies](#dependencies)
* [Installation methods](#installation)
  1. Standard Installation
    * [*NIX](#nix)
    * [Windows](#windows)
  2. Containers and Virtual Machines
    * [Vagrant](#vagrant)
    * [Docker](#docker)
    * [NW.js](#nwjs)
  3. Single-board-computers
    * [Raspberry PI](#raspberry-pi)
    * [Arduino](#arduino)
    * [Intel Edison](#intel-edison)
  4. Linux distribution
* [Running](#running)
  1. [Node](#node)
  2. [PHP5](#php5)
* [Setting up optional features](#setting-up-optional-features)

# Dependencies

You only need these packages installed:

- `git`
- `node` (debian users also need `nodejs-legacy`)
- `npm`

# Installation

OS.js runs on all patforms and web-servers. Choose one of the methods described below, then proceed to the [run](#running) section.

## Standard Installation

You can also find documentation on this on the [official homepage](http://os.js.org/doc/manuals/man-install.html).

If you want to install on your computer or server directly:

### *NIX

See [install-nix.md](https://github.com/os-js/OS.js/blob/master/doc/install-nix.md).

### Windows

See [install-windows.md](https://github.com/os-js/OS.js/blob/master/doc/install-windows.md).

## Containers and Virtual Machines

If you want to install on your computer, but in an isolated environment (container)

### Vagrant

See [Vagrant.md](https://github.com/os-js/OS.js/blob/master/doc/Vagrant.md).

### Docker

See [Docker.md](https://github.com/os-js/OS.js/blob/master/doc/Docker.md).

### NW.js

See [NW.md](https://github.com/os-js/OS.js/blob/master/doc/NW.md).

## Single-board-computers

You can also install/deploy OS.js on these platforms, but has some spesific documentation:

### Raspberry PI

See [platform-raspi.md](https://github.com/os-js/OS.js/blob/master/doc/platform-raspi.md).

### Arduino

See [platform-arduino.md](https://github.com/os-js/OS.js/blob/master/doc/platform-arduino.md).

### Intel Edison

See [platform-edison.md](https://github.com/os-js/OS.js/blob/master/doc/platform-edison.md).

## Linux distribution

OS.js can run as a Linux distribution on top of X11. See [install-x11.md](https://github.com/os-js/OS.js/blob/master/doc/install-x11.md) for more information.

# Running

*If you installed OS.js with a container (above), you can skip the step(s) below*

After you have successfully installed OS.js you need to start a server. You can either do this by running behind a traditional webserver or see how to start them manually below.

When you have started a server, simply navigate to [http://localhost:8000](http://localhost:8000) (port 8000 is default).

## Node

This is the prefered method for running OS.js.

See [server-node.md](https://github.com/os-js/OS.js/blob/master/doc/server-node.md) for more information about running on Node.

```
# Start production server (linux or windows)
./bin/start-dist.sh or bin\win-start-dist

# Start development server (linux or windows)
./bin/start-dev.sh or bin\win-start-dev
```

## PHP5

See [server-php.md](https://github.com/os-js/OS.js/blob/master/doc/server-php.md) for more information about running on PHP.

You can also run without a webserver, using the command-line:

```
# Start production server
(cd dist; php -S 0.0.0.0:8000 ../src/server/php/server.php)

# Start development server
(cd dist-dev; php -S 0.0.0.0:8000 ../src/server/php/server.php)
```

# Setting up optional features

Visit the [official documentation](http://os.js.org/doc/manuals/) for more information.
