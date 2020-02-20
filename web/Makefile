.PHONY: all provision provision-dev local_install test ssh

local_install:
	sudo apt-add-repository -y ppa:ansible/ansible
	sudo apt-get update
	sudo apt-get install -y ansible
	ansible-galaxy install -r roles.txt

provision:
	ansible-playbook -i ./provision/hosts.ini ./provision/playbook.yml

deploy:
	ansible-playbook -i ./provision/hosts.ini ./provision/playbook.yml --tags app

test:
	bash ./provision/scripts/test.sh

ssh:
	ssh -i /srv/comfortmaps-secrets/keys/comfortmaps-web.pem sclay@comfortmaps.com
