# OS.js on Arduino

OS.js runs on Arduino with an official build: https://github.com/arduino-org/Arduino-OS

A ready built package is available via official `opkg` repository named **arduinoos**.

This build uses **Lua** which was spesifially made to use `uhttpd` (openwrt).

## Make your own image

Make sure to use the `arduino` branch for this

```
./bin/build-opkg.sh osjs 2.0.0-0001 ar71xx arduino
```
