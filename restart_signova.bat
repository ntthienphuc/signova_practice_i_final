@echo off
setlocal
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap_and_restart.ps1" %*
endlocal
