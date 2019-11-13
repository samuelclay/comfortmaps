## PostgreSQL

sudo su postgres -c "pg_ctl -D /usr/local/var/postgres stop" # Stop 9.4
sudo launchctl stop /Library/LaunchDaemons/com.edb.launchd.postgresql-9.4.plist

sudo launchctl load /Library/LaunchDaemons/com.edb.launchd.postgresql-9.4.plist