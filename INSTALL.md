# Installation
Installation only requires a few small steps.

## Notes

By default OS.js filesystem is restricted to `/opt/OSjs/tmp` and `/opt/OSjs/home`.
Make sure these directories exist and are readable+writable by the running web-server process.

More information on configuring the backend and frontend on Wiki.

### Apache + PHP
* Clone OS.js-v2 (use `git --recursive` to pull dependency packages automatically)
* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", you can most likely skip this)
  * Make sure .htaccess is allowed
  * Make sure mod_rewrite is enabled

You should now be up and running :)

### Node.js
* Please note that the node server is not finished yet, but is working for development purposes*

* Clone OS.js-v2 with (git --recursive)
* Run `backend/server.js`

You should now be up and running :)
