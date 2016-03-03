# Install OS.js on *NIX

This are the instructions on how to install on Linux and BSD platforms:

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
