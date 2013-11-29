For now only a PHP backend is provided. A Node.js version will be provided in the future
when the API has been finalized.

# Frontend
No configuration is required here. You can override settings in the backend.

# Backend

## Configuration
See `config.example.php`.

### Notes
In the current state filesystem operations are limited to `/opt/OSjs`. You can override this in the configuration.

Make sure this directory contains the sub-directories `home` and `tmp`. These must be writable
by Apache.


## Setting up a server

### Apache + PHP
* Clone OS.js-v2 with (git --recursive)
* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", skip this)
* Make sure .htaccess is allowed (With "Allow override", normally allowed by default)
* Make sure mod_rewrite is enabled (Normally allowed by default)

You should now be up and running :)

### Node.js
** NOT YET PROVIDED **
* Clone OS.js-v2 with (git --recursive)
* Run `backend/server.js`

You should now be up and running :)
