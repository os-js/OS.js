#! /bin/bash

echo "STORAGE : $STORAGE"

if [ -z $STORAGE ]; then STORAGE="database"; fi
if [ -z $USER ]; then USER="admin"; fi
if [ -z $PASS ]; then PASS="admin"; fi


if [ $STORAGE == "sqlite" ]
then
	# Authentificator
	node osjs config:set --name=authenticator --value=database
	node osjs config:set --name=server.modules.auth.database.driver --value=sqlite
	node osjs build:config

	# Storage
	node osjs config:set --name=storage --value=database
	node osjs config:set --name=server.modules.storage.database.driver --value=sqlite
	node osjs build:config

	cp src/templates/misc/authstorage.sqlite src/server/
	mkdir vfs/home/$USER
elif [ $STORAGE == "mysql" ]
then
	if [ -z $MYSQL_HOST ]; then MYSQL_HOST="localhost"; fi;
	if [ -z $MYSQL_PASSWORD ]; then echo "MYSQL PASSWORD IS REQUIRED"; exit 1; fi;
	if [ -z $MYSQL_USER ]; then echo "MYSQL USER IS REQUIRED"; exit 1; fi;

	try=0
	db_status=$(mysql --host="$MYSQL_HOST" --use="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="select 1;" 2>/dev/null || echo down)
	while [ $db_status == "down" 2>/dev/null ]
	do
		try=$(($try+1))
		echo "CAN'T CONNECT TO MYSQL HOST : $try TRY"

		db_status=$(mysql --host="$MYSQL_HOST" --use="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="select 'ok';" 2>/dev/null || echo down)
		if [ $try -gt 10 ]
		then
			exit
		fi
		sleep 2
	done
	echo "CONNECTED"
	# SET UP DATABASE
	mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --execute="CREATE DATABASE osjs;"
	mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --database='osjs' --execute="\
		GRANT USAGE ON *.* TO $MYSQL_USER@$MYSQL_HOST IDENTIFIED BY '$MYSQL_PASSWORD'; \
		GRANT ALL PRIVILEGES ON osjs.* TO $MYSQL_USER@$MYSQL_HOST;"

	mysql --host="$MYSQL_HOST" --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" --database='osjs' < src/templates/misc/authstorage.sql

	# STORAGE
	node osjs config:set --name=storage --value=database
	node osjs config:set --name=server.modules.storage.database.driver --value=mysql
	node osjs config:set --name=server.modules.storage.database.mysql.host --value=$MYSQL_HOST
	node osjs config:set --name=server.modules.storage.database.mysql.user --value=$MYSQL_USER
	node osjs config:set --name=server.modules.storage.database.mysql.password --value=$MYSQL_PASSWORD
	node osjs config:set --name=server.modules.storage.database.mysql.database --value=osjs
	node osjs build:config
	# AUTHENTIFICATOR
	node osjs config:set --name=authenticator --value=database
	node osjs config:set --name=server.modules.auth.database.driver --value=mysql
	node osjs config:set --name=server.modules.auth.database.mysql.host --value=$MYSQL_HOST
	node osjs config:set --name=server.modules.auth.database.mysql.user --value=$MYSQL_USER
	node osjs config:set --name=server.modules.auth.database.mysql.password --value=$MYSQL_PASSWORD
	node osjs config:set --name=server.modules.auth.database.mysql.database --value=osjs
	node osjs config:set --name=client.ReloadOnShutdown --value=true
	node osjs build:config
fi

if [ $STORAGE == "mysql" ] || [ $STORAGE == "sqlite" ]
then
	node bin/add-user.js add $ADMIN_USER
	node bin/add-user.js pwd $ADMIN_USER $ADMIN_PASS
fi
bash bin/start.sh
