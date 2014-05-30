#
# OS.js v2 Makefile
#
# Targets:
# 	all              Build OS.js
# 	compress         Compress dist 
# 	clean            Clean dist
# 	config           Build only configuration files
# 	core             Build only core files
# 	packages         Build only package files
# 	themes           Build only theme files
# 	manifest         Create package manifest
#
# Others:
# 	php-webserver        Start PHP webserver
# 	node-webserver       Start Node webserver
# 	dev-php-webserver    Start PHP webserver for developers
# 	dev-node-webserver   Start Node webserver for developers
#

.PHONY: all clean config core themes packages compress manifest
.DEFAULT: all

#
# BUILDING
#

all: clean config core themes packages manifest

clean:
	rm -f dist/packages.json ||:
	rm -f dist/osjs.* ||:
	rm -rf dist/packages/* ||:
	rm -rf dist/themes/* ||:

core:
	@echo "\033[1;32mBuilding OS.js Core\033[0m"
	(bin/build-dist)

config:
	@echo "\033[1;32mBuilding OS.js Configurations\033[0m"
	(bin/build-config)

packages:
	@echo "\033[1;32mBuilding Packages\033[0m"
	cp -R src/packages/* dist/packages/

themes:
	@echo "\033[1;32mBuilding Themes\033[0m"
	(bin/create-themes)
	cp -R src/themes/wallpapers dist/themes/

compress:
	@echo "\033[1;33mMaking compressed distro\033[0m"
	(bin/compress-dist)

manifest:
	@echo "\033[1;33mCreating package manifest\033[0m"
	(bin/create-manifest)

#
# OTHER
#

php-webserver:
	(cd dist; php -S localhost:8000 ../src/server-php/webserver.php)

node-webserver:
	node src/server-node/server.js

dev-php-webserver:
	(cd dist-dev; php -S localhost:8000 ../src/server-php/webserver.php)

dev-node-webserver:
	node src/server-node/server.js dist-dev

