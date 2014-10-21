
# High-priority
* _[Misc]_ There are some FIXME and TODO markers in the code
* _[VFS]_ Finish Google Drive implementation
   - Copy file that already has this name fails (including upload)
   - Create dirs in subdirectories
   - Deleting a folder does not restore the root parent of items
* _[Backend]_ Finish Node.js backend
  - Custom handler support
  - Add User/Sessions in Core API (take from PHP)
  - Add 'demo' handler (take from PHP)
  - Add 'example' handler (take from PHP)
* _[Locales]_ Finish the format strings
* _[Backend]_ Finish WebSocket hander implementation
* _[Documentation]_ Complete documentation for JavaScript

# Low-priority
* _[CoreWM]_ When DnD-ing items over windowlist panelitem, peek windows :)
* _[Themes]_ More Themes
* _[VFS]_ Finish Google Drive implementation
   - Add support for trash
   - Add support to recover from trash
   - Add support for modifying permissions
   - Add support for modifying properties
   - Add support for comments
   - Add support for revisioning
* _[Dialogs]_ Rewrite for better button handling
* _[Application]_
  - MusicPlayer -- Finish
  - MusicPlayer -- Node ApplicationAPI
  - CoreWM -- Custom keyboard binding shortcuts
  - CoreWM -- Finish panel item options
  - Draw -- Finish features (marked in source)
  - Draw -- Add more effects with the convolute method
  - CodeMirror -- Probably needs a refactor
  - Writer -- Finish
* _[GUI]_ Menu -- Bind keyboard buttons to menu items
* _[GUI]_ GUIScrollbar
* _[GUI]_ Write an alternative and fully custom GUISelect/GUISelectList

# Other
* _[Misc]_ Offline VFS ?!
* _[Compability]_ Fix crazy IE bug where calling blur() actually minimizes the browser window *facepalm*

# Ideas for solving misc problems
* Unfocused windows should have a transparent overlay to prevent clicks+iframe probles
  * When DnD hide
