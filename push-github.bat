@echo off
REM Script para inicializar repositório Git e subir para o GitHub

REM Solicite ao usuário o link do repositório
set /p repo_url=Digite a URL do repositório GitHub (ex: https://github.com/usuario/repositorio.git): 

REM Inicializa o repositório
if not exist .git (
    git init
)

git add .
git commit -m "Primeiro commit"
git branch -M main
git remote add origin %repo_url%
git push -u origin main

pause