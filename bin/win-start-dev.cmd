@ECHO OFF
for %%i in ("%~dp0..") do set "folder=%%~fi"
ECHO This script will launch OS.js in node using: `node src\server\node\server.js dist-dev`
ECHO To stop node server, press CTRL+C

where /q supervisor
IF ERRORLEVEL 1 (
    ECHO supervisor not installed, the server will not be live reloaded
    node "%folder%\src\server\node\server.js" dist-dev
) ELSE (
    ECHO supervisor is installed, live reload is active
    supervisor --watch "%folder%\src\server" -- "%folder%\src\server\node\server.js" dist-dev
)



