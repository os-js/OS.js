YUI_EXEC="/opt/yuicompressor-2.4.8.jar"
SRC_CORE_JS=$(shell find src/javascript/*.js src/javascript/handlers/demo.js)
SRC_CORE_CSS=$(shell find src/javascript/*.css)

all:
	echo ">>> Compiling JavaScript"
	cat ${SRC_CORE_JS} > dist/.osjs.js
	java -jar ${YUI_EXEC} --type js --charset=utf-8 dist/.osjs.js -o dist/osjs.js
	
	echo ">>> Compiling CSS"
	cat ${SRC_CORE_CSS} > dist/.osjs.css
	java -jar ${YUI_EXEC} --type css --charset=utf-8 dist/.osjs.css -o dist/osjs.css
	
	echo ">>> Compiling Applications"
	cp -R src/packages/*/* dist/apps/
