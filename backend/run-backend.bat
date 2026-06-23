@echo off
title Vinoteca Backend - http://localhost:8110
echo.
echo ============================================
echo   VINOTECA BACKEND - Spring Boot 3
echo ============================================
echo   Puerto: 8110
echo   DB: vinos_galan (Claude / Magui420)
echo ============================================
echo.
echo Iniciando... (espera 15-30 segundos)
echo.

cd /d "%~dp0"

REM Opción 1: Si tenés Maven instalado
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [1] Maven encontrado, usando...
  call mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
  goto end
)

REM Opción 2: Usar mvnw (Maven Wrapper)
if exist mvnw.cmd (
  echo [2] Usando Maven Wrapper...
  call mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
  goto end
)

REM Opción 3: Usar Java directamente si JAR existe
if exist target\*.jar (
  echo [3] Ejecutando JAR compilado...
  for /f "tokens=*" %%f in ('dir /b target\*.jar ^| findstr /V original') do (
    set JAR_FILE=%%f
  )
  if defined JAR_FILE (
    java -jar target\%JAR_FILE% --spring.profiles.active=dev
    goto end
  )
)

echo.
echo ERROR: No se pudo iniciar el backend.
echo.
echo OPCIONES:
echo 1. Instala Maven: https://maven.apache.org/download.cgi
echo 2. O abre en IntelliJ IDEA y ejecuta: Run > Run 'VinotecaApplication'
echo.
pause

:end
pause
