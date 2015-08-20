; OS.js NSIS Installer script

;--------------------------------

Name "OS.js"
OutFile "installer.exe"
InstallDir "C:\osjs"
RequestExecutionLevel admin

;--------------------------------

Page directory
Page instfiles

;--------------------------------

Section ""
  SetOutPath $INSTDIR
  CreateDirectory $INSTDIR\temp
  
  ; Download
  inetc::get https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/src/tools/windows-installer/installer.ps1 "$INSTDIR\temp\installer.ps1"
  Pop $R0 ;Get the return value
    StrCmp $R0 "OK" +3
      MessageBox MB_OK "Download failed: $R0"
      Quit

  ;ExecWait "$INSTDIR\temp\installer.cmd"
  ExecWait "PowerShell.exe -ExecutionPolicy ByPass -File $INSTDIR\temp\installer.ps1 $INSTDIR"


SectionEnd
