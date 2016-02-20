With the *mysql* handler you can enable a login prompt for OS.js.

## Setup

```
# Install node dependency
$ npm install mysql bcryptjs

# Change `handler` to `mysql`.
$ grunt config:set:handler:mysql
$ grunt config:set:server.handlers.mysql.host:localhost
$ grunt config:set:server.handlers.mysql.user:osjsuser
$ grunt config:set:server.handlers.mysql.password:osjspassword
$ grunt config:set:server.handlers.mysql.database:osjs

# Update configurations
$ grunt config

# Rebuild (only required if you use `dist`)
# grunt core

```

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

-- Create administration user {username : admin , password : admin}

INSERT INTO `users` (`username`, `password`, `name`, `groups`)
VALUES ('admin', '$2y$10$No35SQZ6AnOVaxfHm9vut.9BqzqFy4lwxxlOmvuF4CIh7wCQ1QcYK', 'Administrator', '["admin"]');

-- Create normal user with all groups {username : user , password : user}

INSERT INTO `users` (`username`, `password`, `name`, `groups`)
VALUES ('user', '$2y$10$zbsaDuXt33X31PePp7H/Xen1jR3tvaC8t.JGxJldxW535eK9TRkV6', 'Normal User', '["api","application","vfs","upload","curl"]');

```

### Create users in VFS area

```
mkdir vfs/home/admin
mkdir vfs/home/user
```
