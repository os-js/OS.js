# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty32"

  config.vm.provider "virtualbox" do |vb|
    vb.cpus = 1
    vb.memory = 512
  end

  config.vm.hostname = "osjsv2"
  config.vm.network :forwarded_port, guest: 80, host: 8080

  config.vm.provision "shell", inline: <<-SHELL
    # update system
    aptitude -y upgrade

    # configure apache2 and php5
    aptitude -y install apache2 libapache2-mod-php5
    a2enmod rewrite
    service apache2 restart

    # install tools
    aptitude -y install make git npm
    ln -s /usr/bin/nodejs /usr/bin/node

    # build OS.js-v2
    sudo npm install -g grunt-cli
    git clone https://github.com/andersevenrud/OS.js-v2.git
    pushd OS.js-v2
    npm install
    grunt

    # configure apache2 to serve OS.js-v2 dist-dev
    grunt apache-vhost | sed '1d' | sed '$d' > apache-vhost.conf
    sed -i -e 's/#Require/Require/' apache-vhost.conf
    sudo cp apache-vhost.conf /etc/apache2/sites-available/000-default.conf
    sudo service apache2 restart

    # update permissions
    popd
    sudo chown -R vagrant:vagrant OS.js-v2
    sudo chown -R www-data:www-data OS.js-v2/vfs
  SHELL
end
