#
# OS.js v2 Makefile
#
# Targets:
# 	all              Build OS.js
# 	compress         Compress dist 
# 	clean            Clean dist
# 	core             Build only core files
# 	packages         Build only package files
# 	themes           Build only theme files
# 	manifest         Create package manifest
#

SRC_CORE_CSS =  src/stylesheets/main.css \
		src/stylesheets/core.css \
		src/stylesheets/dialogs.css \
		src/stylesheets/dialogs/alert.css \
		src/stylesheets/dialogs/applicationchooser.css \
		src/stylesheets/dialogs/color.css \
		src/stylesheets/dialogs/confirm.css \
		src/stylesheets/dialogs/errormessage.css \
		src/stylesheets/dialogs/file.css \
		src/stylesheets/dialogs/fileinfo.css \
		src/stylesheets/dialogs/fileprogress.css \
		src/stylesheets/dialogs/fileupload.css \
		src/stylesheets/dialogs/font.css \
		src/stylesheets/dialogs/input.css \
		src/stylesheets/gui.css \
		src/stylesheets/gui/button.css \
		src/stylesheets/gui/canvas.css \
		src/stylesheets/gui/checkbox.css \
		src/stylesheets/gui/colorswatch.css \
		src/stylesheets/gui/fileview.css \
		src/stylesheets/gui/iconview.css \
		src/stylesheets/gui/label.css \
		src/stylesheets/gui/listview.css \
		src/stylesheets/gui/menu.css \
		src/stylesheets/gui/menubar.css \
		src/stylesheets/gui/panedview.css \
		src/stylesheets/gui/progressbar.css \
		src/stylesheets/gui/radio.css \
		src/stylesheets/gui/richtext.css \
		src/stylesheets/gui/scrollview.css \
		src/stylesheets/gui/select.css \
		src/stylesheets/gui/selectlist.css \
		src/stylesheets/gui/slider.css \
		src/stylesheets/gui/statusbar.css \
		src/stylesheets/gui/tabs.css \
		src/stylesheets/gui/text.css \
		src/stylesheets/gui/textarea.css \
		src/stylesheets/gui/toolbar.css \
		src/stylesheets/gui/treeview.css

SRC_CORE_JS = src/javascript/utils.js \
		src/javascript/locales.js \
		src/javascript/core.js \
		src/javascript/helpers.js \
		src/javascript/gui.js \
		src/javascript/gui/button.js \
		src/javascript/gui/canvas.js \
		src/javascript/gui/checkbox.js \
		src/javascript/gui/colorswatch.js \
		src/javascript/gui/iconview.js \
		src/javascript/gui/label.js \
		src/javascript/gui/listview.js \
		src/javascript/gui/menu.js \
		src/javascript/gui/menubar.js \
		src/javascript/gui/panedview.js \
		src/javascript/gui/progressbar.js \
		src/javascript/gui/radio.js \
		src/javascript/gui/richtext.js \
		src/javascript/gui/scrollview.js \
		src/javascript/gui/select.js \
		src/javascript/gui/selectlist.js \
		src/javascript/gui/slider.js \
		src/javascript/gui/statusbar.js \
		src/javascript/gui/tabs.js \
		src/javascript/gui/text.js \
		src/javascript/gui/textarea.js \
		src/javascript/gui/toolbar.js \
		src/javascript/gui/treeview.js \
		src/javascript/gui/fileview.js \
		src/javascript/dialogs.js \
		src/javascript/dialogs/alert.js \
		src/javascript/dialogs/applicationchooser.js \
		src/javascript/dialogs/color.js \
		src/javascript/dialogs/confirm.js \
		src/javascript/dialogs/errormessage.js \
		src/javascript/dialogs/file.js \
		src/javascript/dialogs/fileinfo.js \
		src/javascript/dialogs/fileprogress.js \
		src/javascript/dialogs/fileupload.js \
		src/javascript/dialogs/font.js \
		src/javascript/dialogs/input.js \
		src/javascript/handler.js \
		src/javascript/handlers/demo.js \
		src/javascript/main.js

.PHONY: all clean core apps compress manifest
.DEFAULT: all

#
# BUILDING
#

all: clean core themes packages manifest

compress:
	@echo "\033[1;33mMaking compressed distro\033[0m"
	(bin/compress-dist)

clean:
	rm -f dist/packages.json ||:
	rm -f dist/osjs.* ||:
	rm -rf dist/packages/* ||:
	rm -rf dist/themes/* ||:

core:
	@echo "\033[1;32mBuilding Core JavaScript\033[0m"
	cat ${SRC_CORE_JS} > dist/osjs.js
	@echo "\033[1;32mBuilding Core CSS\033[0m"
	cat ${SRC_CORE_CSS} > dist/osjs.css

packages:
	@echo "\033[1;32mBuilding Packages\033[0m"
	cp -R src/packages/* dist/packages/

themes:
	@echo "\033[1;32mBuilding Themes\033[0m"
	(bin/create-themes)
	cp -R src/themes/wallpapers dist/themes/

#
# OTHER
#

manifest:
	@echo "\033[1;33mCreating package manifest\033[0m"
	(bin/create-manifest)

php-webserver:
	(cd dist; php -S localhost:8000 ../src/server-php/webserver.php)

node-webserver:
	node src/server-node/server.js

