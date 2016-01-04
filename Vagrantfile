# -*- mode: ruby -*-
# vi: set ft=ruby :

# Install Plugins...
unless Vagrant.has_plugin?("vagrant-omnibus") and Vagrant.has_plugin?("vagrant-hostsupdater") and Vagrant.has_plugin?("vagrant-vbguest")
  unless Vagrant.has_plugin?("vagrant-omnibus")
    system('vagrant plugin install vagrant-omnibus')
  end
  unless Vagrant.has_plugin?("vagrant-hostsupdater")
    system('vagrant plugin install vagrant-hostsupdater')
  end
  unless Vagrant.has_plugin?("vagrant-vbguest")
    system('vagrant plugin install vagrant-vbguest')
  end
end

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty32"

  config.vm.provider "virtualbox" do |v|
    v.customize ["modifyvm", :id, "--memory", 512]
    v.customize ["modifyvm", :id, "--cpus", 1]
    v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    v.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
  end

  config.ssh.forward_agent = true
  config.vm.hostname = "osjs.dev"
  config.vm.network :private_network, ip: "192.168.60.4"

  config.vm.provision "shell", inline: <<-SHELL
    # update system
    aptitude -y update

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
