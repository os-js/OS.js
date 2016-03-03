# Install OS.js on Windows

This are the instructions on how to install on Windows platforms:

## Automated

Download and run http://os.js.org/installer.exe.

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
