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

Environement variables : 
	- STORAGE : Storage type ( mysql | sqlite )
	- ADMIN_USER : Admin username used to log into OS.js 
	- ADMIN_PASS : Admin password
	- MYSQL_HOST : mysql server host
	- MYSQL_USER : mysql user
	- MYSQL_PASSWORD :  mysql user password

Docker compose example : 
```
nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro

os:
    build: ./osjs
    command: ./bin/docker_start.sh
    ports:
      - "86:8000"
    environment:
      - "VIRTUAL_HOST=osjs.local"
      - "STORAGE=mysql"
      - "ADMIN_USER=admin"
      - "ADMIN_PASS=admin"
      - "MYSQL_HOST=mysql"
      - "MYSQL_USER=root"
      - "MYSQL_PASSWORD=PASSWORD"
    depends_on:
      - nginx-proxy
      - mysql

mysql:
    image: mysql:5.7
    environment:
      - "MYSQL_ROOT_PASSWORD=PASSWORD"
```