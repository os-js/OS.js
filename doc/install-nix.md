# Install OS.js on *NIX

This are the instructions on how to install on Linux and BSD platforms.

Make sure you have **all dependencies installed** before beginning.

## Automated

```
$ curl -sS http://os.js.org/installer | sh
```

## Manual

```shell
$ sudo npm install -g grunt-cli
$ git clone https://github.com/os-js/OS.js.git
$ cd OS.js
$ npm install --production
$ grunt
```

You can download and extract a zip-file instead of using `git`, but is not recommended as it makes the update process harder.

## Running

When you have started a server, simply navigate to [http://localhost:8000](http://localhost:8000) (port 8000 is default).

### Node

See [server-node.md](https://github.com/os-js/OS.js/blob/master/doc/server-node.md) for more information about running on Node.

```
# Start production server
./bin/start-dist.sh

# Start development server
./bin/start-dev.sh
```

### PHP5

See [server-php.md](https://github.com/os-js/OS.js/blob/master/doc/server-php.md) for more information about running on PHP.

You can also run without a webserver, using the command-line (but not recomended):

```
# Start production server
(cd dist; php -S 0.0.0.0:8000 ../src/server/php/server.php)

# Start development server
(cd dist-dev; php -S 0.0.0.0:8000 ../src/server/php/server.php)
```
