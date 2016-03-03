# OS.js on PHP

**Please note that the PHP will be deprecated in the future (or at least moved to its own repository)**

Below is a list of supported methods of deployment (you choose one of these):

## Apache

Run `grunt apache-vhost` to generate config file (or look in doc/configs/ for example)

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

## Lighttpd

Run `grunt lighttpd-config` to generate config file (or look in doc/configs/ for example)

## Nginx

Run `grunt nginx-config` to generate config file (or look in doc/configs/ for example)

## WAMP

Works fine. Just look up the Apache section above for configuration.

## Misc

If you have a "webhost" (or "webhotel") with ex. cPanel without shell access (or no node support), you can run OS.js, but has to be built on another computer, then transfered over to the target machine. The only downside here is that you'd have to run from /OS.js/dist/ without doing modifications to the setup (if you don't have access to mod_rewrite to create proxy rules).

You can find more info on this [here](https://github.com/os-js/OS.js/blob/master/doc/cpanel-host.md).
