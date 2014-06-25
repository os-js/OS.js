You can run OS.js on top of a Linux distro like a thin-client or desktop solution

# Set up Linux

In this example "Ubuntu Server" was used with the user "osjs"

# Install dependencies

```
sudo apt-get install nodejs virtualbox-x11 npm libwebkit-dev ligbwebkitgtk-dev build-essential
```

# Copy system image

```
sudo cp -rv vendor/system-image/* /
```

# Set up system service


# Start up

`/etc/init.d/osjs start`


## Using a login manager

*Slim* configs included
