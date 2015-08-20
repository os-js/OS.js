cd dist-dev

del client
del themes
del vendor
del packages

mklink /D client ..\src\client
mklink /D themes ..\dist\themes
mklink /D vendor ..\dist\vendor
mklink /D packages ..\src\packages

cd ..
