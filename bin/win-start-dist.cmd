@ECHO OFF
for %%i in ("%~dp0..") do set "folder=%%~fi"
ECHO This script will launch OS.js in node using: `node src\server\node\server.js dist`
ECHO To stop node server, press CTRL+C
pause
node "%folder%\src\server\node\server.js"
