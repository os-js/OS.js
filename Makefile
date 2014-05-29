YUI_EXEC="/opt/yuicompressor-2.4.8.jar"
SRC_CORE_CSS=$(shell find src/stylesheets/ -type f -name "*.css")

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

all:
	@rm -f dist/.osjs.* ||:
	@rm -f dist/osjs.* ||:
	
	@echo ">>> Compiling JavaScript"
	cat ${SRC_CORE_JS} > dist/.osjs.js
	
	@echo ">>> Compiling CSS"
	cat ${SRC_CORE_CSS} > dist/.osjs.css
	
	@echo ">>> Compiling Applications"
	cp -R src/packages/*/* dist/apps/
	
	@echo ">>> Making uncompress distro"
	mv dist/.osjs.js dist/osjs.js
	mv dist/.osjs.css dist/osjs.css

compressed:
	@rm -f dist/.osjs.* ||:
	@rm -f dist/osjs.* ||:
	
	@echo ">>> Compiling JavaScript"
	cat ${SRC_CORE_JS} > dist/.osjs.js
	
	@echo ">>> Compiling CSS"
	cat ${SRC_CORE_CSS} > dist/.osjs.css
	
	@echo ">>> Compiling Applications"
	cp -R src/packages/*/* dist/apps/
	
	@echo ">>> Making compressed distro"
	java -jar ${YUI_EXEC} --type js --charset=utf-8 dist/.osjs.js -o dist/osjs.js
	java -jar ${YUI_EXEC} --type css --charset=utf-8 dist/.osjs.css -o dist/osjs.css
	rm dist/.osjs.*

php-webserver:
	(cd src/web; php -S localhost:8000 ../server-php/webserver.php)

node-webserver:
	node src/server-node/server.js

.PHONY: all
