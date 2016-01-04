@ECHO OFF
for %%B in (%~dp0\.) do set c=%%~dpB
ECHO This script will launch OS.js in node using: `node src\server\node\server.js dist`
ECHO To stop node server, press CTRL+C
pause
node "%c%\src\server\node\server.js"
