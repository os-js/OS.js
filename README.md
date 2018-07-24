<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) desktop implementation for your browser with a fully-fledged window manager, Application APIs, GUI toolkits and filesystem abstraction.

[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)
[![JS.ORG](https://img.shields.io/badge/js.org-os-ffb400.svg)](http://js.org)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andersevenrud%40gmail%2ecom&lc=NO&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)

# OS.js

This is the OS.js base project that you can use as a template to make your own distributions, installations and do general development.

**PLEASE NOTE THAT THIS IS AN ALPHA PRE-RELEASE AND SUBJECT TO CHANGE WITHOUT NOTICE**

https://github.com/os-js/OS.js/issues/671

## Try it yourself

Visit the [official demo](https://demo.os-js.org) for a preview version. Please note that some features are disabled and might be outdated or unavailable at times.

*Official v3 demo coming soon*

![ScreenShot](https://www.os-js.org/screenshot.png)

## Requirements

Node 8 (or newer) and any modern web-browser.

## Installation

> OS.js runs on `localhost:8000` by default.

```
# Clone *only* the v3 branch
git clone -b v3 --single-branch https://github.com/os-js/OS.js.git
cd OS.js
```

You can now either use Docker:

```
cp .env.example .env
edit .env
docker-compose up
```

Or set up locally on your own system:

```
# Install dependencies
npm install

# Select your packages
npm install @osjs/standard-theme
npm install @osjs/example-application

# Discover installed packages
npm run package:discover

# Build your client
npm run build

# Start serving
npm run serve
```

For a list of packages, see the [official resource list](https://manual.os-js.org/v3/resource/official/).

## Documentation

* [Manuals](https://manual.os-js.org/v3/)
* [Contribution Guide](https://github.com/os-js/OS.js/blob/v3/CONTRIBUTING.md)

## Links

* [Official Chat](https://gitter.im/os-js/OS.js)
* [Community Forums and Announcements](https://community.os-js.org/)
* [Homepage](https://os-js.org/)
* [Twitter](https://twitter.com/osjsorg) ([author](https://twitter.com/andersevenrud))
* [Google+](https://plus.google.com/b/113399210633478618934/113399210633478618934)
* [Facebook](https://www.facebook.com/os.js.org)
* [Docker Hub](https://hub.docker.com/u/osjs/)
