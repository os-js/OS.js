REM Fixing Symlinks for OS.js dist-dev
REM Run this as an administrator from OS.js root directory
REM EX: src\tools\installer.cmd

SET srcdir=%CD%
SET dstdir=%CD%\dist-dev

del %dstdir%\blank.css
mklink "%dstdir%\blank.css" "%srcdir%\dist\blank.css"

del %dstdir%\favicon.ico
mklink "%dstdir%\favicon.ico" "%srcdir%\dist\favicon.ico"

del %dstdir%\favicon.png
mklink "%dstdir%\favicon.png" "%srcdir%\dist\favicon.png"

del %dstdir%\settings.js
mklink "%dstdir%\settings.js" "%srcdir%\dist\settings.js"

del %dstdir%\css
mklink /j "%dstdir%\css" "%srcdir%\src\stylesheets"

del %dstdir%\js
mklink /j "%dstdir%\js" "%srcdir%\src\javascript"

del %dstdir%\packages
mklink /j "%dstdir%\packages" "%srcdir%\src\packages"

del %dstdir%\themes
mklink /j "%dstdir%\themes" "%srcdir%\src\themes"

npm install
grunt --force
