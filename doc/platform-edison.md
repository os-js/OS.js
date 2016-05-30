# OS.js on Intel Edison

## Dependencies

```
$ npm install -g userid
```

## Manual installation

Just follow the manual installation docs and you should be able to run without any problems.

To install git, use:

```
$ edit vi /etc/opkg/base-feeds.conf

  src all http://iotdk.intel.com/repos/2.0/iotdk/all
  src x86 http://iotdk.intel.com/repos/2.0/iotdk/x86
  src i586 http://iotdk.intel.com/repos/2.0/iotdk/i586

$ opkg update
$ opkg install git
```

**NOTE** Installing on *vfat* sdcards is causing some problems with `npm` packages. Any other linux-based filesystem seems to work just fine.

## Package installation

```
$ edit vi /etc/opkg/base-feeds.conf

  src all https://builds.os.js.org/opkg/edison/all
  src x86 https://builds.os.js.org/opkg/edison/x86
  src i586 https://builds.os.js.org/opkg/edison/i586

$ opkg update
$ opkg install osjs
```

## Make your own image

```
$ ./bin/build-opkg.sh osjs 2.0.0-VERSION all intel-edison
$ ./bin/build-opkg.sh osjs 2.0.0-VERSION x86 intel-edison
$ ./bin/build-opkg.sh osjs 2.0.0-VERSION i586 intel-edison
```

## How to start

Currently there is no automatic startup, so you have to do this manually

**PAM support is in development**

```
mkdir /home/demo
/osjs/bin/start-edison.sh
```

## Managing users

Authentication is done via the system, but OS.js runs with its own group setup.

See [https://github.com/os-js/OS.js/blob/master/doc/handler-shadow.md](shadow handler documentation) for more information.
