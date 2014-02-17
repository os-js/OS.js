
## Roadmap

### Alpha
* Squash all the remaining bugs
* Finish Applications

## TODOs
* Finish Node.js backend
* Metadata descriptions
* CoreWM: Custom keyboard binding shortcuts
* CoreWM: Finish Panel implementation
* Create bin/ scripts for nodejs (redo create-application for PHP)
* Create OSjs.Core.File for abstraction (we can then remove filename/mime var combinations)
* Cache user settings after login (like core settings)
* Abstraction for Handlers
  - Create frontend/handlers/demo.js
  - Create frontend/handlers/example.js

* Offline resource pre-loading (not prioritized)
* Offline VFS (not prioritized)
* Full Source code documentation (not prioritized)
* Mobile version (not prioritized)

* Applications:
  * New Draw codebase -- layer, effect support etc.
  * Writer - Check for changes before opening/new file
  * CoreWM/Settings - Implement hotkey toggle
  * CoreWM/Settings - Implement hotkey customization
  * CoreWM/Settings - Implement windowswitcher toggle
  * CoreWM/Settings - Sounds toggle
  * Finish Music Player
  * Finish File Manager

* GUI Elements:
  * Custom styling for GUISelect
  * GUISelectList
  * GUITreeView
  * GUILabel

* Localization (Translations)
  - MusicPlayer
  - Writer
  - Draw

### Ideas for solving misc problems
* Unfocused windows should have a transparent overlay to prevent clicks+iframe probles
  * When DnD hide
