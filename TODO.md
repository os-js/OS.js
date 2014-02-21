
## Roadmap

### Alpha
* Squash all the remaining bugs
* Finish Applications

## TODOs
* Finish Node.js backend
* Create reserved strings for locales in `locales.js` (for core messages etc)

### Applications
* New Draw codebase -- layer, effect support etc.
* Writer - Check for changes before opening/new file
* Finish Music Player
* Finish File Manager

Remember to refactor application .currentFile + .currentMime > .CurrentFile = {name: '', mime: ''}

### GUI Elements
* Custom styling for GUISelect
* GUITreeView
* GUILabel

### Localization (Translations)
* Languages
  - de_DE for Applications

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
