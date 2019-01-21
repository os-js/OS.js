#!/usr/bin/env bash

# Author: Spaceboy Ross
# Name: OS.js Install Script for Linux

ARGUMENT_LIST=(
  "help"
  "pm2"
  "systemd"
  "verbose"
)

options=$(getopt \
  --longoptions "$(printf "%s," "${ARGUMENT_LIST[@]}")" \
  --name "$(basename "$0")" \
  --options "" \
  -- "$@"
)
eval set -- "$options"

# Options variables
OSJS_FORK="https://github.com/OS-js/OS.js"
OSJS_PATH="$HOME/OS.js"
PM2_SERVICE=false
SYSTEMD_SERVICE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help)
      echo "Usage: $(basename $0)"
      echo "    --help       Usage for script."
      echo "    --pm2        Enables PM2 service."
      echo "    --systemd    Enables systemd service."
      echo "    --repo [url] Sets the OS.js fork to use. (Default: $OSJS_FORK)"
      echo "    --out [path] Sets the path to place OS.js. (Default: $OSJS_PATH)"
      echo "    --verbose    Enables verbose mode."
      exit 0
      ;;
    --pm2)
      PM2_SERVICE=true
      shift 1
      ;;
    --systemd)
      SYSTEMD_SERVICE=true
      shift 1
      ;;
    --repo)
      OSJS_FORK=$2
      shift 2
      ;;
    --out)
      OSJS_PATH=$2
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift 1
      ;;
    *)
      break
      ;;
  esac
  shift
done

command_check() {
  if type $1 2>/dev/null; then
    echo "Error: command $1 not found, you must have $1 installed in order to use this script."
    exit 1
  fi
}

install_pkg() {
  PKGNAME=$1
  if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
  elif type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
  elif [ -f /etc/lsb-release ]; then
    # For some versions of Debian/Ubuntu without lsb_release command
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
  elif [ -f /etc/debian_version ]; then
    # Older Debian/Ubuntu/etc.
    OS=Debian
    VER=$(cat /etc/debian_version)
  else
    # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
    OS=$(uname -s)
    VER=$(uname -r)
  fi

  case $OS in
    Arch Linux)
      if [ "$EUID" -ne 0 ]
        echo "Warning: command not running as root."
        command_check sudo
        sudo pacman -S $PKGNAME --noconfirm
      else
        pacman -S $PKGNAME --noconfirm
      fi
      ;;
    Debian)
      if [ "$EUID" -ne 0 ]
        echo "Warning: command not running as root."
        command_check sudo
        sudo apt-get install $PKGNAME -y
      else
        apt-get install $PKGNAME -y
      fi
      ;;
    *)
      echo "Error: unsupported distro $OS"
      exit 1
      ;;
  esac
}

if type git 2>/dev/null; then
  echo "Warning: command git not found, installing git."
  install_pkg git
fi

if type npm 2>/dev/null; then
  echo "Warning: command npm not found, installing npm."
  install_pkg npm
fi

if type node 2>/dev/null; then
  echo "Warning: command node not found, installing nodejs."
  install_pkg nodejs
fi

if $PM2_SERVICE; then
  if type pm2 2>/dev/null; then
    echo "Warning: command pm2 not found, installing pm2."
    if [ "$EUID" -ne 0 ]; then
      echo "Warning: command not running as root."
      command_check sudo
      if $VERBOSE; then
        sudo npm install -g pm2
      else
        sudo npm install -g pm2 1>/dev/null
      fi
    else
      if $VERBOSE; then
        npm install -g pm2
      else
        npm install -g pm2 1>/dev/null
      fi
    fi
  fi
fi

if $VERBOSE; then
  echo "Downloading repository $OSJS_FORK to $OSJS_PATH..."
  git clone $OSJS_FORK $OSJS_PATH
else
  echo "Downloading repostiory in progress..."
  git clone $OSJS_FORK $OSJS_PATH 1>/dev/null
fi

cd $OSJS_PATH

echo "Installing packages..."
if $VERBOSE; then
  npm install
else
  npm install 1>/dev/null
fi

echo "Building..."
if $VERBOSE; then
  npm run build
else
  npm run build 1>/dev/null
fi

echo "Finding applications..."
if $VERBOSE; then
  npm run package:discover
else
  npm run package:discover 1>/dev/null
fi

if $PM2_SERVICE; then
  echo "Enabling PM2 service..."
  if $VERBOSE; then
    pm2 start $OSJS_PATH/src/server/index.js
  else
    pm2 start $OSJS_PATH/src/server/index.js 1>/dev/null
  fi
fi

if $SYSTEMD_SERVICE; then
  echo "Enabling systemd service..."
  if [ "$EUID" -ne 0 ]; then
    echo "Warning: user is not root."
    sudo bash -c 'cat << EOF > /etc/systemd/system/osjs.service
[Unit]
Description=OS.js Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
ExecStart=$(readlink -f $(which node)) $OSJS_PATH/src/server/index.js

[Install]
WantedBy=multi-user.target
EOF'
    sudo systemctl enable osjs.service
  else
    cat << EOF > /etc/systemd/system/osjs.service
[Unit]
Description=OS.js Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
ExecStart=$(readlink -f $(which node)) $OSJS_PATH/src/server/index.js

[Install]
WantedBy=multi-user.target
EOF
    systemctl enable osjs.service
  fi
fi

echo "Finished, have a good day :)"

# vim:set ts=2 sw=2 et:
