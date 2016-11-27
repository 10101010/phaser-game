#!/usr/bin/env bash

apt-get --assume-yes install python-stdeb
sed -i -e 's/xmlrpclib.ServerProxy(pypi_url, transport=transport)/pypi = xmlrpclib.ServerProxy(pypi_url)/g' /usr/bin/pypi-install
pypi-install diamond
cp /vagrant/diamond.conf /etc/diamond/
diamond
apt-get --assume-yes install npm
apt-get --assume-yes install mongodb
apt-get --assume-yes install imagemagick
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 6
apt-get --assume-yes install git
mkdir ~/test_app
git clone git://github.com/madhums/node-express-mongoose-demo.git ~/test_app
cd ~/test_app
npm install
cp .env.example .env
