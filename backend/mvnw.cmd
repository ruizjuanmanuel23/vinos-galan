@REM Maven Wrapper for Windows
@REM
@REM Usage: mvnw [goal]

@echo off
setlocal

set MAVEN_OPTS=-Xmx512m

for /f "tokens=*" %%a in ('cd') do set CURR_DIR=%%a
set WRAPPER_SCRIPT="%CURR_DIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPS="%CURR_DIR%\.mvn\wrapper\maven-wrapper.properties"

if not exist %WRAPPER_SCRIPT% (
  echo Descargando Maven Wrapper...
  powershell -Command "& {(New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar', %WRAPPER_SCRIPT%)}"
)

java -cp %WRAPPER_SCRIPT% org.apache.maven.wrapper.MavenWrapperMain %*
