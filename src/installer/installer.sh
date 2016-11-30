#!/bin/bash
#
# OS.js automated installer
#
# Simply run this command and you're ready to go
#   curl -sS http://os-js.github.io/OS.js/installer | sh
#


REPO="https://github.com/os-js/OS.js.git"
DEST="OS.js"

if [ -d "$DEST" ]; then
  echo "Destination already exists"
  exit 1
fi

if [ -e /etc/debian_version ]; then
  if ! which npm | grep -s -q "/npm"
  then
    sudo apt-get install -y npm
  fi
  if ! which git | grep -s -q "/git"
  then
    sudo apt-get install -y git
  fi
  if ! which node | grep -s -q "/node"
  then
    sudo apt-get install -y nodejs-legacy
  fi
else
  if ! which npm | grep -s -q "/npm"
  then
    echo "please install npm"
    exit 1
  fi
  if ! which git | grep -s -q "/git"
  then
    echo "please install git"
    exit 1
  fi
  if ! which node | grep -s -q "/node"
  then
    echo "please install nodejs-legacy"
    exit 1
  fi
fi

echo "Downloading OS.js"
git clone --recursive $REPO $DEST

echo "Building"
cd $DEST
npm install --production
node osjs build

echo "INSTALLATION COMPLETE :-)"
echo "Run 'node osjs run' to start the server"
echo "https://os.js.org/manual/"
