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
# 	manifest         Create package manifest (you need to run 'make packages' first)
# 	apache-htaccess  Generate new .htaccess files
# 	apache-vhost     Generate new apache vhost config file
# 	lighttpd-config  Generate new lighttpd config files
#

.PHONY: all clean config core themes packages compress manifest
.DEFAULT: all

#
# BUILDING
#

all: clean config core themes packages manifest

clean:
	rm -f dist/themes.json ||:
	rm -f dist-dev/themes.json ||:
	rm -f dist/packages.json ||:
	rm -f dist-dev/packages.json ||:
	rm -f dist/osjs.* ||:
	rm -rf dist/packages/* ||:
	rm -rf dist/themes/* ||:

core:
	@echo "\033[1;35mBuilding OS.js Core\033[0m"
	rm -f dist/osjs.* ||:
	(bin/build core)

config:
	@echo "\033[1;35mBuilding OS.js Configurations\033[0m"
	(bin/build config)

packages:
	@echo "\033[1;35mBuilding Packages\033[0m"
	rm -rf dist/packages/* ||:
	(bin/build packages)

themes:
	@echo "\033[1;35mBuilding Themes\033[0m"
	rm -rf dist/themes/* ||:
	(bin/build themes)
	cp -R src/themes/wallpapers dist/themes/

compress:
	@echo "\033[1;35mMaking compressed distro\033[0m"
	(bin/build compress)

manifest:
	@echo "\033[1;35mCreating manifest files\033[0m"
	rm -f dist/packages.json ||:
	rm -f dist-dev/packages.json ||:
	(bin/build package-manifest)
	rm -f dist/themes.json ||:
	rm -f dist-dev/themes.json ||:
	(bin/build theme-manifest)

apache-htaccess:
	(bin/build apache-htaccess)

apache-vhost:
	(bin/build apache-vhost)

lighttpd-config:
	(bin/build lighttpd-config)

