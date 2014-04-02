# Installation
Installation only requires a few small steps.

**How to pull code:** `git --recursive`


## Notes

By default OS.js filesystem is restricted to `/opt/OSjs/tmp` and `/opt/OSjs/home`.
Make sure these directories exist and are readable+writable by the running web-server process.

More information on configuring the backend and frontend on Wiki.

*Small Note: OS.js will not run without a web-server unless you modify browser cross-origin settings and update files to load from relative paths.*

### PHP5 With Apache

See `doc/apache.conf` for an example

* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", you can most likely skip this)
  * Make sure .htaccess is allowed
  * Make sure mod_rewrite is enabled

### PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Run `php -S localhost:8000 bin/php-webserver.php`

### Node.js
*Please note that the node server is not finished yet, but is working for development purposes*

* Run `backend/server.js`

### Lighttpd

See `doc/lighttpd.conf` for an example
