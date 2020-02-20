.PHONY: all provision provision-dev local_install test ssh sshfs

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

sshfs:
	-diskutil unmount force /Users/sclay/projects/cmweb
	sshfs -o allow_other,defer_permissions,IdentityFile=/srv/comfortmaps-secrets/keys/comfortmaps-web.pem sclay@comfortmaps.com:/srv/comfortmaps /Users/sclay/projects/cmweb
	cd ~/projects/cmweb
