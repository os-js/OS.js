# OS.js on NW

## Building your own

Run:

```shell
# Install NW grunt builder library
npm install grunt-nw-builder

# Make NW build
grunt nw
```

Your build will be located in `.nw`

## Possible problems

If you get `Fatal error: path must be a string` (a bug in nw-builder)

Run:

```
npm install nw-builder@2.1.0
```

to downgrade and try again

## Prebuilt packages

You can also get ready builds from http://builds.os.js.org/nw/.

Please note that these might be outdated!
