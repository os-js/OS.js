With the *mysql* handler you can enable a login prompt for OS.js.

**This assumes you have a server running with mysql already and that you know how to use the CLI utilities.**

## Setup OS.js

```
# Install node dependency
$ npm install mysql bcryptjs

# Change `handler` to `mysql`.
$ grunt config:set --name=handler --value=mysql
$ grunt config:set --name=server.handlers.mysql.host --value=localhost
$ grunt config:set --name=server.handlers.mysql.user --value=osjsuser
$ grunt config:set --name=server.handlers.mysql.password --value=osjspassword
$ grunt config:set --name=server.handlers.mysql.database --value=osjs

# Make OS.js reload after you log out
$ grunt config:set name=client.ReloadOnShutdown --value=true

# Update configurations
$ grunt build:config

# Rebuild (only required if you use `dist`)
# grunt build:core --target=dist

```

## Setup Mysql

Create a database and user in your mysql server with the information you entered above:

```

# Log on to mysql server with an administrator account (in this case 'root')
$ mysql -u root -p

# Create the new database
mysql> CREATE DATABASE osjs;

# Create the new user
mysql> GRANT USAGE ON *.* TO osjsuser@localhost IDENTIFIED BY 'osjspassword';

# Grant access to the user on created database
mysql> GRANT ALL PRIVILEGES ON osjs.* TO osjsuser@localhost;

```

Then import the required table:

```

$ mysql -u osjsuser -p osjs < doc/handler-mysql.sql

```

## Create user(s)

Use the utility that comes with OS.js. You will be prompted for a password when managing the users:

```

# Add normal user
node bin/mysql-user.js add anders api,application,fs,upload,curl
mkdir vfs/home/anders

# Add administrator user
node bin/mysql-user.js add myadminaccount admin
mkdir vfs/home/myadminaccount

```
