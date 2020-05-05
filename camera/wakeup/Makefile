all:
	gcc -lwiringPi wakeup.c -o wakeup
	chmod a+x wakeup

run:
	./wakeup

config:
	sudo cp wakeup.config /etc/systemd/system/wakeup.service
	sudo systemctl enable wakeup