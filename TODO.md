
## Roadmap

## TODOs
* Finish Node.js backend
* Create reserved strings for locales in `locales.js` (for core messages etc)
* Application compability check list (like in v1 -- metadata)

### Applications
* New Draw codebase -- layer, effect support etc.
* Writer -- Check for changes before opening/new file
* Finish Music Player
* Refactor from currentX to currentFile.x for file stuff
* CoreWM -- Finish panel item options

### GUI
* More Themes
* Finish new Menu implementation
* Custom styling for GUISelect
* Custom styling for GUISelectList
* Custom styling for GUICheckbox
* Custom styling for GUIRadio
* FileTreeView implementation
* GUILabel

### Not prioritized
* Create bin/ scripts for nodejs (redo create-application for PHP)
* Offline resource pre-loading
* Offline VFS
* Full Source code documentation
* Mobile version
* CoreWM: Custom keyboard binding shortcuts
* Misc FIXME and TODO in source-code
  - `grep -e 'TODO\|FIXME' frontend/* apps/*/*`

## Ideas for solving misc problems
* Unfocused windows should have a transparent overlay to prevent clicks+iframe probles
  * When DnD hide
