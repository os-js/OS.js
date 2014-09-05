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
	(src/tools/ojbt core)

config:
	@echo "\033[1;35mBuilding OS.js Configurations\033[0m"
	(src/tools/ojbt config)

packages:
	@echo "\033[1;35mBuilding Packages\033[0m"
	rm -rf dist/packages/* ||:
	(src/tools/ojbt packages)

themes:
	@echo "\033[1;35mBuilding Themes\033[0m"
	rm -rf dist/themes/* ||:
	(src/tools/ojbt themes)
	cp -R src/themes/wallpapers dist/themes/

compress:
	@echo "\033[1;35mMaking compressed distro\033[0m"
	(src/tools/ojbt compress)

manifest:
	@echo "\033[1;35mCreating manifest files\033[0m"
	rm -f dist/packages.json ||:
	rm -f dist-dev/packages.json ||:
	(src/tools/ojbt package-manifest)
	rm -f dist/themes.json ||:
	rm -f dist-dev/themes.json ||:
	(src/tools/ojbt theme-manifest)

apache-htaccess:
	(src/tools/ojbt apache-htaccess)

apache-vhost:
	(src/tools/ojbt apache-vhost)

lighttpd-config:
	(src/tools/ojbt lighttpd-config)

