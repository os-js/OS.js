With the *example* handler you can enable a login prompt for OS.js.

This handler is only available for PHP at the moment.

## Setup

* Edit `src/conf/000-base.json` and set handler to `example`
* Copy `src/javascript/handlers/example/index.html` to `dist/example.html`
* Copy `src/javascript/handlers/example/index.html` to `dist-dev/example.html`
* Run `grunt config` to update configuration files
* Run `grunt dist-dev-index` to update html index file (If using dist-dev)
* Run `grunt core` to rebuild (If using dist)

## Configure

The you'll need to set-up the mysql database and edit `src/server-php/handlers/example/handler.php`.


Create this table:
```
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `groups` text,
  `settings` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;
```
