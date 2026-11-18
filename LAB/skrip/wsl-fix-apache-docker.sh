#!/bin/bash
echo '=== apache2: pindahkan port 80 -> 8081 (nginx sudah pakai 80) ==='
sed -i 's/^Listen 80$/Listen 8081/' /etc/apache2/ports.conf
cat /etc/apache2/ports.conf
a2dissite 000-default >/dev/null 2>&1 || true
apache2ctl configtest
systemctl restart apache2 2>&1 | tail -n1
sleep 2
curl -s -o /dev/null -w 'apache2 :8081 -> HTTP %{http_code}\n' http://localhost:8081/
systemctl is-active apache2
echo
echo '=== docker daemon (WSL) ==='
service docker start 2>&1
sleep 4
timeout 15 docker info --format 'ServerVersion={{.ServerVersion}}' 2>&1
