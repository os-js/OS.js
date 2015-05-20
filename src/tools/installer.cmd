REM Fixing Symlinks for OS.js dist-dev
REM Run this as an administrator from OS.js root directory
REM EX: src\tools\installer.cmd

SET srcdir=%CD%
SET dstdir=%CD%\dist-dev

del /N %dstdir%\blank.css
mklink "%dstdir%\blank.css" "%srcdir%\dist\blank.css"

del /N %dstdir%\favicon.ico
mklink "%dstdir%\favicon.ico" "%srcdir%\dist\favicon.ico"

del /N %dstdir%\favicon.png
mklink "%dstdir%\favicon.png" "%srcdir%\dist\favicon.png"

del /N %dstdir%\settings.js
mklink "%dstdir%\settings.js" "%srcdir%\dist\settings.js"

del /N %dstdir%\css || rmdir %dstdir%\css
mklink /j "%dstdir%\css" "%srcdir%\src\stylesheets"

del /N %dstdir%\js || rmdir %dstdir%\js
mklink /j "%dstdir%\js" "%srcdir%\src\javascript"

del /N %dstdir%\packages || rmdir %dstdir%\packages
mklink /j "%dstdir%\packages" "%srcdir%\src\packages"

del /N %dstdir%\themes || rmdir %dstdir%\themes
mklink /j "%dstdir%\themes" "%srcdir%\src\themes"

npm install & grunt --force
