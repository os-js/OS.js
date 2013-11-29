# Installation
Installation only requires a few small steps. You have to be running a BSD, Linux or something similar to run the server.

## Frontend
You can override default configurations for the frontend using backend.

## Backend
By default OS.js stores all temporary data, user sessions and settings in `/opt/OS.js/tmp` (will be changed in *Alpha-1*).
File storage is restricted to `/opt/OS.js/home` by default.

Make sure these directories exist and are readable+writable by the running web-server process.

You can modify these paths in the configuration file (more info below).

### Apache + PHP
* Clone OS.js-v2 with (git --recursive)
* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", you can most likely skip this)
  * Make sure .htaccess is allowed
  * Make sure mod_rewrite is enabled

You should now be up and running :)

#### Configuration
See `config.example.php` if you want to set up a custom configuration, settings and handlers (not required unless the restrictions notes in the *Backend* section is a problem for your server).

### Node.js
**NOT IN REPOSITORY YET**
* Clone OS.js-v2 with (git --recursive)
* Run `backend/server.js`

You should now be up and running :)
