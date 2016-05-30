With the *shadow* handler you can enable a login prompt for OS.js and connect it to your system authentication system.

## Setup

```
# Install node dependencies (you need shadow development package on your system)
$ npm install git+https://github.com/andersevenrud/passwd-linux
$ npm install userid

# Set up groups
$ mkdir /etc/osjs
$ edit /etc/osjs/groups.json

# Set up package blacklist (optional)
$ edit /etc/osjs/blacklist.json

# Change `handler` to `shadow`
$ grunt config:set:handler:shadow

# Optionally configure the paths used
$ edit src/conf/190-handler.json

# Update configuration and template files
$ grunt config

# Rebuild (only required if you use `dist`)
# grunt core

```

**NOTE:** Also, on some systems you might have to run OS.js server as an administrator (`sudo`) depending on the permissions of the shadow file.


### groups.json

This is an example file for `groups.json`

```
{
  "anders": ["admin"],
  "guest": ["api", "application", "upload", "fs"],
  "marcello": ["api", "application", "curl", "upload", "fs"]
}
```

### blacklist.json

This is an example file for `blacklist.json`

```

{
  "anders": ["ApplicationDraw"]
}

```
