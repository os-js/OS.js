#!/bin/bash
#Script to generate OSJS application like ./GeneratePackage.sh packageName urlIframe

{ echo $1;
  printf 'src/packages/'$1;
  yes "";
} | npm run make:iframe-application

echo "Generate package " $1;
cd src/packages/$1
wget -O icon.png https://www.mathieuchartier.com/wp-content/uploads/social-logo.png
sed -i 's/"category": null,/"category": null,\n  "icon": "icon.png",/' metadata.json
sed -i "s/'data'}/'data'},\n        'icon.png',/" webpack.config.js
npm run build
echo "BUILD";
cd dist
sed -i "s~proc.resource('/data/index.html');~'$2',\n~" main.js
echo "EDIT SRC";
cd ../../../..
npm run package:discover



