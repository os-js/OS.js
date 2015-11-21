#
# Makefile for OS.js X11 Launcher
#
# Copyright (c) 2013 Anders Evenrud <andersevenrud@gmail.com>
# Released under the 2-clause BSD license.
#

CC = gcc
LCFLAGS = -I.
CFLAGS = $(shell pkg-config --cflags gtk+-3.0 webkitgtk-3.0 glib-2.0)
LIBS = $(shell pkg-config --libs gtk+-3.0 webkitgtk-3.0 glib-2.0)
LIBS += -lX11
OUT = session-launch
SRC = main.c

all:
	$(CC) -Wall $(SRC) $(CFLAGS) $(LCFLAGS) -o $(OUT) $(LIBS)

clean:
	rm -f session-launch
	rm -f *.o
	rm -f Makefile.bak

install:
	cp -f session-launch /usr/local/bin/osjs-launcher

uninstall:
	rm -rm /usr/local/bin/osjs-launcher
