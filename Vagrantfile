# -*- mode: ruby -*-
# vi: set ft=ruby :

# Install Plugins...
unless Vagrant.has_plugin?("vagrant-hostsupdater") and Vagrant.has_plugin?("vagrant-vbguest")
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
    v.name = "osjs"
  end

  config.ssh.forward_agent = true
  config.vm.hostname = "osjs.vagrant.dev"
  config.vm.network :private_network, ip: "192.168.60.4"

  config.vm.provision "shell", inline: <<-SHELL
    # Install dependencies
    echo "Installing apt dependencies"
    apt-get install -y git nodejs npm nodejs-legacy >/dev/null
    npm install --silent --quiet -g grunt-cli supervisor >/dev/null

    # Install OS.js
    echo "Installing OS.js"
    git clone https://github.com/os-js/OS.js.git >/dev/null
    pushd OS.js
    npm install --production >/dev/null
    grunt >/dev/null
  SHELL
end
