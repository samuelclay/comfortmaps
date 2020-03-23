.PHONY: all sshfs ssh

ssh:
	ssh pi@comfortmaps01.local

sshfs:
	-diskutil unmount force /Users/sclay/projects/cm01
	sshfs -o allow_other,defer_permissions,IdentityFile=~/.ssh/id_rsa pi@comfortmaps01.local:/home/pi/comfortmaps /Users/sclay/projects/cm01
	cd ~/projects/cm01

restart:
	sudo service camera restart

log:
	sudo journalctl -f -u camera

rlog: restart log

readsd:
	sudo dd if=/dev/disk6 bs=1m | pv | gzip > ~/projects/comfortmaps/cm01.dmg

writesd:
	sudo diskutil unmountDisk /dev/disk6
	sudo gzip -dc ~/projects/comfortmaps/cm01.dmg | sudo dd of=/dev/disk6 bs=5m | pv
