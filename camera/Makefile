.PHONY: all sshfs ssh

ssh:
	ssh pi@camfortmaps01.local

sshfs:
	diskutil unmount force /Users/sclay/projects/cm01
	sshfs -o allow_other,defer_permissions,IdentityFile=~/.ssh/id_rsa pi@comfortmaps01.local:/home/pi/comfortmaps /Users/sclay/projects/cm01
	cd ~/projects/cm01
