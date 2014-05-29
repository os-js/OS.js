YUI_EXEC="/opt/yuicompressor-2.4.8.jar"
SRC_CORE_JS=$(shell find src/javascript/*.* src/javascript/gui/ src/javascript/dialogs/ src/javascript/handlers/demo.js -type f -name "*.js")
SRC_CORE_CSS=$(shell find src/stylesheets/ -type f -name "*.css")


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
