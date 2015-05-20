REM Fixing Symlinks for OS.js dist-dev
REM Run this as an administrator from OS.js root directory
REM EX: src\tools\installer.cmd

SET srcdir=%CD%
SET dstdir=%CD%\dist-dev

del /Q %dstdir%\blank.css
mklink "%dstdir%\blank.css" "%srcdir%\dist\blank.css"

del /Q %dstdir%\favicon.ico
mklink "%dstdir%\favicon.ico" "%srcdir%\dist\favicon.ico"

del /Q %dstdir%\favicon.png
mklink "%dstdir%\favicon.png" "%srcdir%\dist\favicon.png"

del /Q %dstdir%\settings.js
mklink "%dstdir%\settings.js" "%srcdir%\dist\settings.js"

del /Q %dstdir%\css || rmdir %dstdir%\css
mklink /j "%dstdir%\css" "%srcdir%\src\stylesheets"

del /Q %dstdir%\js || rmdir %dstdir%\js
mklink /j "%dstdir%\js" "%srcdir%\src\javascript"

del /Q %dstdir%\packages || rmdir %dstdir%\packages
mklink /j "%dstdir%\packages" "%srcdir%\src\packages"

del /Q %dstdir%\themes || rmdir %dstdir%\themes
mklink /j "%dstdir%\themes" "%srcdir%\src\themes"

npm install & grunt --force
