@echo off
REM Entra na pasta do projeto (onde o .bat está localizado)
cd /d "%~dp0"
echo =============================
echo   Planejador 3D - Inicializacao
echo =============================
@echo off
cd /d "%~dp0"
start "Live Server" cmd /k "npx live-server public"
timeout /t 5 >nul
start "" "http://127.0.0.1:8080/login.html"
exit /b
) else if "%escolha%"=="2" (
	echo Iniciando live-server em nova janela...
	start "Live Server" cmd /k "npm run liveserver"
	echo Aguardando o live-server subir...
	timeout /t 5 >nul
	start msedge "http://127.0.0.1:8080/login.html" || start chrome "http://127.0.0.1:8080/login.html" || start "" "http://127.0.0.1:8080/login.html"
	echo Live-server iniciado e navegador aberto. Pressione qualquer tecla para sair.
	pause
	exit /b
) else if "%escolha%"=="3" (
	echo Iniciando live-server (apenas visual do frontend)...
	start "Live Server Visual" cmd /k "npx live-server public"
	echo Aguardando o live-server subir...
	timeout /t 5 >nul
	start msedge "http://127.0.0.1:8080/login.html" || start chrome "http://127.0.0.1:8080/login.html" || start "" "http://127.0.0.1:8080/login.html"
	echo Live-server (visual) iniciado e navegador aberto. Pressione qualquer tecla para sair.
	pause
	exit /b
) else (
	echo Opcao invalida. Fechando.
	pause
	exit /b
)