@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0ENVIAR-EASY-SITE-PARA-GITHUB.ps1"
pause
