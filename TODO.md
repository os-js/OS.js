
## Roadmap

## TODOs
* Finish Node.js backend
* Create reserved strings for locales in `locales.js` (for core messages etc)
* More Themes!
* Application compability checking stuff
* Trigger Window focus on GUIElement focus (when not focused)
* Misc FIXME and TODO in source-code
  - `grep -e 'TODO\|FIXME' frontend/* apps/*/*`

### Applications
* New Draw codebase -- layer, effect support etc.
* Writer -- Check for changes before opening/new file
* Finish Music Player
* Refactor from currentX to currentFile.x for file stuff
* CoreWM -- Finish panel item options
* CoreWM -- Window Switcher is bugged

### GUI Elements
* Custom styling for GUISelect
* Custom styling for GUISelectList
* Custom styling for GUICheckbox
* Custom styling for GUIRadio
* GUITreeView
* GUILabel

### Not prioritized
* Create bin/ scripts for nodejs (redo create-application for PHP)
* Offline resource pre-loading
* Offline VFS
* Full Source code documentation
* Mobile version
* CoreWM: Custom keyboard binding shortcuts

## Ideas for solving misc problems
* Unfocused windows should have a transparent overlay to prevent clicks+iframe probles
  * When DnD hide
