cd dist-dev

del js
del css
del themes
del vendor
del packages

mklink /D js ..\src\javascript
mklink /D css ..\src\stylesheets
mklink /D themes ..\dist\themes
mklink /D vendor ..\dist\vendor
mklink /D packages ..\src\packages

cd ..
