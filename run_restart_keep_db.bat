@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo [SIGNOVA] RESTARTING STACK KEEPING DATABASE
echo ==================================================
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap_and_restart.ps1" -ApiPort 8010 -WebPort 5173 -KeepDb
endlocal
