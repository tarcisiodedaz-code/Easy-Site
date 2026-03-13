@echo off
title Remover pasta easy-games (duplicada)
echo.
echo Este script remove a pasta easy-games de dentro de "Easy Site"
echo para evitar duplicacao e alto uso do processador.
echo.
echo IMPORTANTE: Feche o Cursor e qualquer terminal que esteja rodando
echo   "npm run dev" antes de continuar.
echo.
pause

cd /d "%~dp0"
if not exist "easy-games" (
  echo A pasta easy-games nao existe aqui. Nada a fazer.
  pause
  exit /b 0
)

echo Removendo pasta easy-games...
rmdir /s /q "easy-games" 2>nul
if exist "easy-games" (
  echo.
  echo NAO FOI POSSIVEL REMOVER. Algum programa esta usando arquivos da pasta.
  echo - Feche o Cursor completamente.
  echo - Feche todos os terminais (PowerShell, CMD).
  echo - Tente rodar este script de novo.
  echo - Se ainda falhar, reinicie o PC e rode o script outra vez.
) else (
  echo Pasta easy-games removida com sucesso.
)
echo.
pause
