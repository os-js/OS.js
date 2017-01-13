@ECHO OFF
for %%i in ("%~dp0..") do set "folder=%%~fi"
cd "%folder%"

cd dist-dev

del /f /q client
del /f /q themes
del /f /q vendor
del /f /q packages

mklink /D client ..\src\client
mklink /D themes ..\dist\themes
mklink /D vendor ..\dist\vendor
mklink /D packages ..\src\packages

cd ..
