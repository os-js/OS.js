# Installing OS.js

Installation is done in a few simple steps and only takes a couple of minutes to get running.

It is highly recommended that you use `git` to install instead of downloading an archive.

## Dependencies

The only requirement is that you have `node` and `npm` installed (v6 or newer).

*Note for Debian/Ubuntu users*: You might need to install the `nodejs-legacy` package.

## Instructions

Inside the OS.js directory:

```
$ npm install
$ node osjs build
$ node osjs run
```

For more information, see the [Installation Manual](https://manual.os-js.org/installation/).

## Docker
Clone this repository.
Build the Dockerfile image : 
```
docker build -t [YOUR_TAG] .
```

Run as demo : 
```
docker run -p 8000:8000 [YOUR_TAG]
```

Run with sqlite storage : 
```
docker run -p 8000:8000 --env STORAGE=sqlite --env ADMIN_USER=admin --env ADMIN_PASS=admin [YOUR_TAG]
```

Access it at localhost:8000.

See [docker-compose file template](https://github.com/os-js/OS.js/tree/development/src/templates/docker/) for a fully running example with mysql database, reverse nginx proxy and docker-compose 

Environement variables :
* STORAGE : Storage type ( mysql | sqlite )
* ADMIN_USER : Admin username used to log into OS.js 
* ADMIN_PASS : Admin password
* MYSQL_HOST : mysql server host
* MYSQL_USER : mysql user
* MYSQL_PASSWORD :  mysql user password


