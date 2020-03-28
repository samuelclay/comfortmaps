.PHONY: all sshfs ssh

ssh:
	ssh pi@comfortmaps02.local

eject:
	-diskutil unmount force /Users/sclay/projects/cm01

sshfs: eject
	sshfs -o allow_other,defer_permissions,IdentityFile=~/.ssh/id_rsa pi@comfortmaps01.local:/home/pi/comfortmaps /Users/sclay/projects/cm01
	cd ~/projects/cm01

restart:
	sudo service camera restart

log:
	sudo journalctl -f -u camera

rlog: restart log

listsd:
	diskutil list

readsd:
	sudo dd if=/dev/disk7 bs=1m | pv | gzip > ~/Desktop/cm01.dmg

writesd:
	sudo diskutil unmountDisk /dev/disk7
	sudo gzip -dc ~/Desktop/cm01.dmg | pv | sudo dd of=/dev/disk7 bs=5m
