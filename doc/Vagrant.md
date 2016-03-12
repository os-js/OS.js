# OS.js on Vagrant

A [Vagrant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Just use [this configuration file](https://raw.githubusercontent.com/os-js/OS.js/master/Vagrantfile).

```shell
$ vagrant up
$ vagrant ssh

  $ cd OS.js
  $ ./bin/start-dev.sh
```

Then simply navigate to [http://192.168.60.4:8000](http://192.168.60.4:8000).
