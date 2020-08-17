<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

# OS.js

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)
[![Support](https://img.shields.io/badge/opencollective-donate-red.svg)](https://opencollective.com/osjs)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://paypal.me/andersevenrud)
[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)

## Introduction

This is the OS.js base repository that you can use as a template to make your own distributions, installations and development environments.

## Try it yourself

Visit the [official demo](https://demo.os-js.org/) for a preview version. Please note that some features are disabled and might be outdated or unavailable at times.

![ScreenShot](https://www.os-js.org/screenshot.png)

## Installation

> OS.js runs on `http://localhost:8000` by default.

### Demo

You can run a demo using Docker without checking out any source-code:

```
docker run -p 8000:8000 osjs/osjs:latest
```

### Custom

Clone the master branch of the official OS.js repository:

```
git clone -b master --single-branch https://github.com/os-js/OS.js.git
cd OS.js
```

#### Docker

You can run OS.js locally without installing anything on your host system if you have Docker and Docker Compose installed.

Simply run the following command and a complete environment will be set up for you:

```
docker-compose up
```

#### Locally

To install directly on the host system you'll need Node 10 (or later).

```
# Install dependencies
npm install

# It's recommended that you update dependencies
npm update

# Optionally install extra packages:
# For a list of packages, see https://manual.os-js.org/resource/official/
npm install @osjs/example-application

# Discover installed packages
npm run package:discover

# Build client
npm run build

# Start serving
npm run serve
```

## Contribution

* **Sponsor on [Github](https://github.com/sponsors/andersevenrud)**
* **Become a [Patreon](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)**
* **Support on [Open Collective](https://opencollective.com/osjs)**
* [Contribution Guide](https://github.com/os-js/OS.js/blob/master/CONTRIBUTING.md)

## Documentation

See the [Official Manuals](https://manual.os-js.org/) for articles, tutorials and guides.

## Links

* [Official Chat](https://gitter.im/os-js/OS.js)
* [Community Forums and Announcements](https://community.os-js.org/)
* [Homepage](https://os-js.org/)
* [Twitter](https://twitter.com/osjsorg) ([author](https://twitter.com/andersevenrud))
* [Facebook](https://www.facebook.com/os.js.org)
* [Docker Hub](https://hub.docker.com/u/osjs/)
