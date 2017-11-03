#! /bin/bash
# OS.js - JavaScript Cloud/Web Desktop Platform
# @author : Jules Bourdalé <jules.bourdale@gmail.com>
# @licence Simplified BSD License

function mysql_connect() {
	try=0
	db_status=$(mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="select ok;" 2>/dev/null || echo down)
	while [ $db_status == "down" 2>/dev/null ]
	do
		try=$(($try+1))

		db_status=$(mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="select 'ok';" 2>/dev/null || echo down)
		if [ $try -gt 10 ]; then 
			echo "Can't connect to mysql server at $MYSQL_HOST"
			exit
		fi
		sleep 2
	done
}

function set_config() {
	config=$(node osjs config:get --name=$1)
	if [ "$config" != "$1 = $2" ]	
	then
		node osjs config:set --name="$1" --value="$2"
		build_required=1
	fi
}

function mysql_execute() {
	echo $(mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="$1")
}

function create_mysql_db() {
	db_exist=$(mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'osjs';")
	if [ -z $db_exist 2>/dev/null ]
	then 
		mysql_execute "CREATE DATABASE osjs;"
		mysql_execute "GRANT USAGE ON *.* TO $MYSQL_USER@$MYSQL_HOST IDENTIFIED BY '$MYSQL_PASSWORD'; \
					   GRANT ALL PRIVILEGES ON osjs.* TO $MYSQL_USER@$MYSQL_HOST;"

		mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --database="osjs" < src/templates/misc/authstorage.sql
	fi
}

function build_config() {
	if [ $build_required == 1 ]
	then
		node osjs build:config	
	fi	
}

function mysql_install() {
	# SET UP DATABASE
	create_mysql_db

	# STORAGE
	echo "Setting up mysql storage..."
	build_required=0
	set_config storage database
	set_config server.modules.storage.database.driver mysql
	set_config server.modules.storage.database.mysql.host $MYSQL_HOST
	set_config server.modules.storage.database.mysql.user $MYSQL_USER
	set_config server.modules.storage.database.mysql.password $MYSQL_PASSWORD
	set_config server.modules.storage.database.mysql.database osjs

	build_config

	# AUTHENTIFICATOR
	echo "Setting up mysql auth..."
	build_required=0
	set_config authenticator database
	set_config server.modules.auth.database.driver mysql
	set_config server.modules.auth.database.mysql.host $MYSQL_HOST
	set_config server.modules.auth.database.mysql.user $MYSQL_USER
	set_config server.modules.auth.database.mysql.password $MYSQL_PASSWORD
	set_config server.modules.auth.database.mysql.database osjs
	set_config client.ReloadOnShutdown true
	
	build_config
}

function sqlite_install() {
	# Authentificator
	echo "Setting up sqlite auth..."
	build_required=0
	set_config authenticator database
	set_config server.modules.auth.database.driver sqlite
	build_config

	# Storage
	echo "Setting up sqlite storage..."
	build_required=0
	set_config storage database
	set_config server.modules.storage.database.driver sqlite
	
	build_config

	if [ ! -f src/server/authstorage.sqlite ]
	then
		echo "Init sqlite db from template"
		cp src/templates/misc/authstorage.sqlite src/server/
	fi
}

if [ -z $STORAGE ]; then STORAGE="database"; fi
if [ -z $USER ]; then USER="admin"; fi
if [ -z $PASS ]; then PASS="admin"; fi

build_required=0

if [ $STORAGE == "sqlite" ]
then
	echo "Installation sqlite Storage and Auth..."
	sqlite_install
	echo "done"
elif [ $STORAGE == "mysql" ]
then
	echo "Installation mysql Storage and Auth..."
	if [ -z $MYSQL_HOST ]; then MYSQL_HOST="localhost"; fi;
	if [ -z $MYSQL_PASSWORD ]; then echo "MYSQL PASSWORD IS REQUIRED"; exit 1; fi;
	if [ -z $MYSQL_USER ]; then echo "MYSQL USER IS REQUIRED"; exit 1; fi;

	mysql_connect
	mysql_install	

	echo "done"
fi

if [ $STORAGE == "mysql" ] || [ $STORAGE == "sqlite" ]
then
	node bin/add-user.js add $ADMIN_USER
	node bin/add-user.js pwd $ADMIN_USER $ADMIN_PASS
	mkdir vfs/home/$ADMIN_USER
fi
bash bin/start.sh
