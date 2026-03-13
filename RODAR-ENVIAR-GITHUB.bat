@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0ENVIAR-PARA-GITHUB.ps1"
pause
