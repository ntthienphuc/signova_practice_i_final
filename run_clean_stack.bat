@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo [SIGNOVA] SHUTTING DOWN AND RESETTING STACK CLEAN
echo ==================================================
powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap_and_restart.ps1" -ApiPort 8010 -WebPort 5173
endlocal
