@echo off
rem Baut das lokale Dashboard aus den Excel-Listen in daten\ neu und oeffnet es im Browser.
cd /d "%~dp0"
set "NODE=node"
for /d %%D in (".werkzeuge\node-*") do set "NODE=%%D\node.exe"
"%NODE%" skripte\dashboard.mjs
if errorlevel 1 (
  echo.
  echo Das Dashboard konnte nicht gebaut werden. Die Meldung steht oben.
  pause
  exit /b 1
)
start "" "dashboard.html"
