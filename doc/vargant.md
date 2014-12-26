Testing
=======

Setup
-----

Install system requirements:

* VirtualBox (https://www.virtualbox.org/)
* Vagrant (https://www.vagrantup.com/)
* git

Clone the project.

```
$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
```

Or alternatively just download the Vargant file.

```
$ wget https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile
```

Provision the vagrant VM.

```
$ vagrant up
```

You should now be able to access ```http://localhost:8080``` and see the
OS.js desktop.
