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
	node bin/add-user.js add $ADMIN_USER
	node bin/add-user.js pwd $ADMIN_USER $ADMIN_PASS

	mkdir vfs/home/$USER
fi

bash bin/start.sh
