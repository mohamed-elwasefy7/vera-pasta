@echo off
rem VERA PASTA — local server launcher
cd /d "%~dp0"
start "" http://localhost:4173
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 4173
) else (
  npx serve -l 4173 .
)
