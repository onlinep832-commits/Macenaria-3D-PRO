@echo off
REM Script para deploy no Netlify
REM Certifique-se de ter o Netlify CLI instalado: npm install -g netlify-cli

REM Faz o build (caso necessário)
echo Nenhum build necessário, apenas copiando arquivos...

REM Faz o deploy da pasta public
netlify deploy --dir=public

pause