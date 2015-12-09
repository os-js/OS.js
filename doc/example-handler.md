With the *example* handler you can enable a login prompt for OS.js.

## Setup

```
# Change `handler` to `example`
$ edit src/conf/000-base.json

# Update configurations
$ grunt config

# Rebuild (only required if you use `dist`)
# grunt core

```

### Configure

Then set up the configuration in these files (you only need to edit the one you use):

- `src/server/php/handlers/example/handler.php`
- `src/server/node/handlers/example/handler.js`


### Mysql Database table

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

### Create users in database

```

-- Create administration user

INSERT INTO `users` (`username`, `password`, `name`, `groups`)
VALUES ('admin', 'admin', 'Administrator', '["admin"]');

-- Create normal user with all groups

INSERT INTO `users` (`username`, `password`, `name`, `groups`)
VALUES ('user', 'user', 'Normal User', '["api","application","vfs","upload","curl"]');

```

### Create users in VFS area

```
mkdir vfs/home/admin
mkdir vfs/home/user
```
