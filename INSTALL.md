For now only a PHP backend is provided. A Node.js version will be provided in the future
when the API has been finalized.

# Frontend
No configuration is required here. You can override settings in the backend.

# Backend

## Configuration
See `config.example.php`. Configuration is not required if you can use the settings in the notes below.

### Notes
By default OS.js is restricted to `/opt/OS.js`.
Make sure this directory contains the sub-directories `home` and `tmp`. These must be writable by Apache.

By default user settings and sessions are stored in `/opt/OS.js/tmp` as JSON-encoded files. Alpha-1 will have a real handler using another method.

You can override default confiurations and handling by making `backend/config.php` (See `config.example.php` for help)

## Setting up a server

### Apache + PHP
* Clone OS.js-v2 with (git --recursive)
* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", skip this)
* Make sure .htaccess is allowed (With "Allow override", normally allowed by default)
* Make sure mod_rewrite is enabled (Normally allowed by default)

You should now be up and running :)

### Node.js
**NOT IN REPOSITORY YET**
* Clone OS.js-v2 with (git --recursive)
* Run `backend/server.js`

You should now be up and running :)
