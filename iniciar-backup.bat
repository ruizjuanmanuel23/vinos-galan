@echo off
REM Inicia el backup automático en background

set ScriptPath=%~dp0backup-automatico.ps1

echo.
echo ============================================
echo   BACKUP AUTOMÁTICO - VINOTECA
echo ============================================
echo.
echo Iniciando script de backup cada 1 hora...
echo Carpeta: C:\BACKUP-VINOTECA
echo.
echo Para ver logs: C:\BACKUP-VINOTECA\backup-log.txt
echo.
echo Presiona Ctrl+C para detener
echo.

REM Ejecutar PowerShell sin mostrar ventana
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%ScriptPath%"

pause
