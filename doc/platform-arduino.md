# OS.js on Arduino

OS.js runs on Arduino with an official build: https://github.com/arduino-org/Arduino-OS

## Official builds

A ready built package is available via official `opkg` repository named **arduinoos**.

This build uses **Lua** which was spesifially made to use `uhttpd` (openwrt).

## Unofficial builds

You can get unofficial and experimental builds from https://builds.os.js.org/opkg/arduino/


## Make your own image

Make sure to use the `arduino` branch for this

```
./bin/build-opkg.sh osjs 2.0.0-VERSION ar71xx arduino
```
