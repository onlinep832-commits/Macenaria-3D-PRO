@echo off
netsh advfirewall firewall add rule name="Node.js 3000" dir=in action=allow protocol=TCP localport=3000
echo Porta 3000 liberada no firewall do Windows.
pause
