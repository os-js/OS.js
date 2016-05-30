# Install OS.js on Windows

This are the instructions on how to install on Windows platforms.

Make sure you have **all dependencies installed** before beginning.

## Automated

Download and run https://os.js.org/installer.exe.

## Manual

**IMPORTANT** Run `cmd` as *Administrator*:

```shell
$ npm install -g grunt-cli
$ git clone https://github.com/os-js/OS.js.git
$ cd OS.js
$ npm install --production
$ bin\create-windows-symlinks
$ grunt --force
```

You can download and extract a zip-file instead of using `git`, but is not recommended as it makes the update process harder.

- [YouTube setup instructions](https://www.youtube.com/watch?v=Cj3OdxTdGGc)

## Running

When you have started a server, simply navigate to [http://localhost:8000](http://localhost:8000) (port 8000 is default).

### Node

See [server-node.md](https://github.com/os-js/OS.js/blob/master/doc/server-node.md) for more information about running on Node.

```
# Start production server
bin\win-start-dist

# Start development server
bin\win-start-dev
```

### PHP5

See [server-php.md](https://github.com/os-js/OS.js/blob/master/doc/server-php.md) for more information about running on PHP.

You can also run without a webserver, using the command-line (but not recomended):

```
# Start production server
cd dist
php -S 0.0.0.0:8000 ..\src\server\php\server.php

# Start development server
cd dist-dev
php -S 0.0.0.0:8000 ..\src\server\php\server.php
```
