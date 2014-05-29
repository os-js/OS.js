#
# OS.js v2 Makefile
#
# Targets:
# 	all              Normal uncompressed build (default, same as 'uncompressed')
# 	compressed       Compressed dist (minimized)
# 	uncompressed     Uncompressed dist
# 	clean            Clean build files
# 	dist             Only build files
# 	packages         Only build packages
# 	manifest         Create package manifest
#

YUI_EXEC = "/opt/yuicompressor-2.4.8.jar"

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
		src/stylesheets/gui/treeview.css \

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

.PHONY: all clean dist apps uncompressed compressed manifest
.DEFAULT: all

all: uncompressed
uncompressed: clean dist packages normal manifest
compressed: clean dist packages minimize manifest

clean:
	rm -f dist/.osjs.* ||:
	rm -f dist/osjs.* ||:
	rm -rf dist/packages/* ||:

dist:
	@echo ">>> Compiling JavaScript"
	cat ${SRC_CORE_JS} > dist/.osjs.js
	
	@echo ">>> Compiling CSS"
	cat ${SRC_CORE_CSS} > dist/.osjs.css

packages:
	@echo ">>> Compiling Applications"
	cp -R src/packages/* dist/packages/

minimize:
	@echo ">>> Making compressed distro"
	java -jar ${YUI_EXEC} --type js --charset=utf-8 dist/.osjs.js -o dist/osjs.js
	java -jar ${YUI_EXEC} --type css --charset=utf-8 dist/.osjs.css -o dist/osjs.css
	rm dist/.osjs.*

normal:
	@echo ">>> Making uncompressed distro"
	mv dist/.osjs.js dist/osjs.js
	mv dist/.osjs.css dist/osjs.css

manifest:
	@echo ">>> Creating packge manifest"
	(bin/create-manifest)

php-webserver:
	(cd src/web; php -S localhost:8000 ../server-php/webserver.php)

node-webserver:
	node src/server-node/server.js

