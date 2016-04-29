# 2.0.0-alpha75

Bugfixes, Locale updates, Security and general improvements.

* API: Prevent error when preload list is empty
* API: Fixed dependencies being loaded in wrong order
* API: Added 'onApplicationPreload' hook
* API: getApplicationResource can now return VFS path
* GUI: Improved error handling in FileView
* GUI: Menu now opens subitems to the left if they escape the viewport
* GUI: gui-iframe now has automatic webview detection
* VFS: registerMountpoint now respects the 'enabled' property
* VFS: Fix upload problems in #364
* VFS: Fixed error handling where some code lead to false-positives
* Utils: Added 'asyncs' method
* Utild: 'dirname' no longer throws error on empty input
* Core: Added lots of freezing/sealing of object to make things immutable
* CoreWM: Update locale properly on saving of settings (visual bug)
* CoreWM: Application list generation now uses 'visible' metadata property
* CoreWM: Moved window switcher to 'ALT+TILDE'
* CoreWM: Added support for modifying shortcuts on desktop (via dialog)
* Calculator: Added Infinity check
* FileManager: Fixed . triggering DELETE key
* package-manager: Added support for adding dummy packages on runtime
* package-manager: Immutable getters
* process: Added _getResource(str) shortcut
* application: Added _loadScheme() shortcut
* Locales: Updated vi_VN
* Locales: Updated fa_FA
* Locales: Updated fr_FR
* Locales: Updated nl_NL
* server-node: Added system login abstraction to handler
* server-node: Updated PAM handler
* server-node: Added 'Shadow' handler
* server-node: Default Handler can now handle directory formatting properly
* server-node: Added colored logging output
* server-node: Updated internal proxy support
* server-node: Now uses tmpdir defined in config
* server-node: Improved file uploading support
* intel-edison: Now uses the shadow handler
* intel-edison: Updated support and filesystem
* build: Updated intel-edison support
* build: Updated package build support (ex, arduino, edison, raspi)
* build: opkg templates updated
* build: Now using grunt-contrib-validate-xml for Scheme validation
* build: Icon Packs now support 'parent' theme
* build: Added 'grunt packages:list' task
* build: Fixed usage on wrong identifier for autostart generation
* doc: Updated documentation
* doc: Updated README
* doc: Updated INSTALL
* doc: New Screenshot in README
* misc: Updated dependencies

# 2.0.0-alpha74

New wallpaper, UI improvements, bugfixes and many improvements to the build system(s). Also new developer features!

**API CHANGE**: http://community.os.js.org/t/notice-updated-gui-methods/33

**API CHANGE**: http://community.os.js.org/t/notice-recent-api-changes/31

* UI: New Wallpaper
* UI: Added loading bar to boot
* UI: Added WAI-ARIA support
* UI: Schemes can now change window properties (like dimensions)
* GUI: Fixed menu not disappearing in certain cases
* GUI: Added `getNextElement()` helper method
* GUI: Better `show()` and `hide()` methods for GUI Elements
* GUI: GUI Elements now has `appendHTML()` method
* GUI: GUI Elements now has `remove()` and `empty()` methods
* GUI: `append()` in GUI Elements now builds items correctly (when doing it dynamically)
* GUI: Added minimum sizes to some containers where missing
* GUI: gui-image src checked if null
* GUI: Fixed radios not getting unselected properly
* GUI: Better Scheme APIs
* GUI: Added DnD support to TreeView
* GUI: Updated gui-richtext error handling
* GUI: Updated gui-paned-view resize events to be more precise
* GUI: All elements now support clipboard
* GUI: Better DataView abstractions for ease of development (extensions)
* API: Updated cURL method with new functionality
* API: Added onhashchange support for application messaging
* API: Deprecated `Application::_call()` in favour of `Application::_api()`
* API: `API.call()` now has pattern `=> fn(err, res)`
* API: Moved `API::createDraggable()` to `GUI::Helpers::createDraggable()`
* API: Moved `API::createDroppable()` to `GUI::Helpers::createDroppable()`
* Dialogs: Prevent HTML injection in confirm dialog
* Dialogs: Focus the 'abort' button by default
* Windows: Updated next tab support
* Windows: Added `_find()` shortcut for scheme
* Windows: Added `_findByQuery()` shortcut for scheme
* Utils: Better $hasClass
* ProcessViewer: Remaned forgotten file
* MusicPlayer: Updated compability
* FileManager: Now has clipboard support
* FileManager: Added new keyboard shortcuts
* Calculator: Focus is now always on the input field
* locales: Added missing it_IT translations
* locales: Improved ru_RU translations
* package-manager: Better extension support
* package-manager: Updated user-installed package support
* platform: Updated edison support
* build: Updated NW support
* build: Removed all dist files, now generated from template
* build: Updated config generation and setting
* build: Updated manifest generation
* build: Fixed setting configs with leading zeroes
* build: Metadata now supports `uses` property
* build: Metadata now supports `depends` property
* build: Apache files now generated with proxies from config
* build: Enabling/Disabling packages now happends in config, not manifest
* server-node: Added 'rawtype' option to `VFS::write()`
* server-node: Prevent crash when loading of extension fails
* server-node: Added support for proxies
* server-node: Now supports spawning child processes
* server-node: Now uses proper sessions via cookie
* config: Updated to relative paths
* misc: Updated Travis support
* misc: Updated Vagrant support
* misc: Updated Docker support
* misc: Updated packages.json dependencies
* misc: Updated MIME database
* misc: Cleanups
* doc: Updated CONTRIBUTING
* doc: Updated README
* doc: Updated INSTALL
* doc: Updated homepage
* doc: Updated docs

# 2.0.0-alpha73

A ton of fixes, improvements and developer support updates!

Now also supports Intel Edison platforms.

* GUI: Better touch support
* GUI: Better scaling support
* GUI: Added media-queries for devices <800px
* GUI: gui-grid now dynamic
* GUI: Added some more generics to CSS (like % containers)
* API: Added relaunc() to relaunch/reload apps
* API: getIcon() should now always return proper file icons
* VFS: General improvements
* VFS: WebDAV implementation complete
* VFS: Better handling of copy/move between identical transports
* VFS: General improvements
* About: Rewritten
* Preview: Fixed video position
* Calculator: Refactored completely
* Settings: Package Management moved to its own app
* Settings: Now only shows physically loaded languages
* CoreWM: Updated weather panel item
* CoreWM: Updated windowlist panel item
* CoreWM: Cleaned up CSS
* CoreWM: Fixed loading indicators
* CoreWM: Updated touch menu
* CoreWM: Improved notification area
* CoreWM: No longer shows handles on non-resizable windows
* CoreWM: Improved resize clamping
* CoreWM: Simplified Window HTML markup a bit
* FileManager: Added create connection dialog
* iframe-application: Better initialization
* iframe-application: Better bi-directional communications support
* dialogs: Support for creating from custom callback and scheme
* utils: Added `acceptcodes` to XHR call
* handlers: Updated init() patterns
* handlers: Updated NW support
* handlers: Simplified integration
* handlers: Now supports blacklisting of apps
* handlers: Now reads settings from src/conf
* handlers: Better mysql handler
* handlers: bcrypt in mysql handler
* handlers: Demo handler fixes for PHP
* locales: Updated en_EN
* locales: Updated fr_FR
* locales: Updated ko_KR
* server-node: Updated APIs
* server-node: Better extension support
* server-node: Fixed where curl would returned garbled binaries
* server-node: Bugfixes
* server-node: Updated HTTP return codes
* server-node: Deny deletion of protocol root dirs
* server-node: Better logging
* server-php: Deny deletion of protocol root dirs
* build: Added support for generating Handlers
* build: Grunt now handles extensions better
* build: Renamed `package.json` to `metadata.json` for apps
* build: Better package extension support
* build: Added `autostart` parameter to package metadata
* build: Better feedback on grunt create-package tasks
* build: Now supports making opkg dists
* build: Better deb dist support
* build: Includes a "packaging" script
* doc: Updated INSTALL
* doc: Updated README
* doc: Updated CONTRIBUTING
* doc: Updated all platform docs
* doc: Updated all installation docs
* doc: Updated code docs
* misc: Added .github (new) features
* misc: Updated templates
* misc: Removed deprecated methods
* misc: Updated browser compabilty
* misc: Fixed some possible vulnerabilities
* platform: Now fully supports Intel Edison

# 2.0.0-alpha72

New Logo, Moved repo to organization, Better privilege and group support, a ton of bugfixes and improvements!

* Calculator: Updates
* Writer: Updates
* FileManager: Locale updates
* FileManager: UI improvements and better VFS triggers
* CoreWM: Improved notifications
* CoreWM: When shut down, settings are reset to defaults
* CoreWM: Fixed desktop shortcuts
* CoreWM: Fixed loading indicators
* Draw: Locale updates and bugfixes
* dialogs: Updated File dialog, bugfixes
* dialogs: API::createDialog() now has default callback
* windowmanager: Bugfixes
* windownanager: Clamp resize values when resizing
* gui: StatusBar improvements
* gui: PanedView improvements
* gui: FileView improvements and fixes
* gui: Updated login screen look
* scheme: Bugfixes
* handler: Improved API
* handler: Updated NW support
* handler: Included server handlers now use bcrypt
* settings-manager: Improved saving
* application: _onMessage() now returns boolean
* application: Moved get/set Argument functions down to process
* iframe-application: IE/Edge improvements
* default-application: Added CTRL+S shortcut
* default-application: Added CTRL+O shortcut
* zip-archiver: Added removal support and many fixes and improvements
* vfs: Added 'Blob' support
* vfs: Added support for custom mountpoints via client API
* vfs: Added WebDAV support
* vfs: Overhault of apis
* vfs: Support for HTTP reads over general api
* vfs: Better handling of datauri data transfers
* vfs: File upload abstraction improvements
* api: HTTP API URI overhalut (entirely new and improved)
* server-node: Now has checkserver-nodePrivilege
* server-node: Now has checkVFSPrivilege
* server-node: Now has checkPackagePrivilege
* server-node: Added exif info in fileinfo()
* server-node: Added permission info in fileinfo()
* server-node: General improvements and cleanups
* server: Reworked handler server integration
* themes: Some Firefox related fixes
* themes: updated Wallpaper
* themes: updated favicon
* themes: Updated 'Material' theme
* locales: Added Portuguese (pt_BR)
* locales: Added Korean (ko_KR)
* locales: Updated French (fr_FR)
* locales: Updated Polish (pl_PL)
* utils: XHR call now has timeout argument
* utils: XHR IE/Edge updates
* utils: Added parseurl() function
* build: Added 'ReloadOnShutdown' client config
* build: Updated Windows symlinks script
* build: Grunt compress task now also does core files
* build: Improved Windows support
* build: Added support for creating dummy packages
* build: Updated Gruntfile
* build: Improved 'dist' file generation
* build: Updated unit-tests
* build: CSS is now also linted
* build: Code style check improvements
* build: Now places manifest in server dir for backend as well
* build: Support for custom server src/conf entries
* misc: Added .editorconfig
* misc: Updated installer scripts
* misc: Updated locales overall
* misc: Code file-tree updates
* misc: Removed deprecated code
* misc: Cleaned up a lot of stuff
* misc: Improved error logging
* misc: Updated Vagrantfile
* misc: Added new error handling to async functions
* misc: jshint
* misc: Updated MIME database
* misc: Moved some dependencies to devDependencies
* doc: Updated README
* doc: Updated INSTALL
* doc: Added logo SVG sources
* doc: Added complete node backend documentation
* doc: Cleaned up all documentation
* doc: Updated bithoundrc
* doc: Updated package.json
* doc: Updated badges

# 2.0.0-alpha71

OS.js exploded on social media and there was a lot of activity. This is just a digest of all the changes.

Thanks to everyone for helping out :-)

* server-php: Now returns ISO8601 dates
* server-node: VFS::upload() now respects 'overwrite' flag
* server-node: Separation of all backend logic
* zip-archiver: Added add() and list() support and other improvements
* FileManager: Added read-only symbol in list and other improvements
* ProcessViewer: Fixed column sizes
* Draw: Bugfixes
* Calculator: Bugfixes
* CoreWM: Clock PanelItem now has configurable tooltip
* Window: Some improvments to async handling
* Application: _getMainWindow() now returns actual window
* GUI: ListView improvements
* GUI: FileView improvements
* GUI: General improvements
* GUI: StatusBar improvements
* GUI: Richtext improvements
* Dialogs: File dialog improvements
* VFS: Dropbox now has proper timeout for requests
* VFS: upload() now has support for custom parameters
* Utils: Added Utils::$escape()
* themes: Added material theme
* locales: Updated en_EN
* locales: Updated pl_PL
* locales: Updated vi_VN
* locales: Updated nl_NL
* locales: Updated fr_FR
* locales: Added tr_TR
* locales: Added bg_BG
* locales: Added sk_SK
* misc: Lots of bugfixes
* misc: All windows should now get focus back after dialog close
* misc: You can now run server helper scripts from any cwd
* misc: Renamed example-handler to mysql-handler
* misc: linting and style updates to entire codebase
* misc: General async improvements leading to less triggered errors
* misc: Updated MIME maps
* misc: A lot of cleanups
* misc: New logo!
* build: You can now set config via `grunt config:set`
* build: You can now get config via `grunt config:get`
* build: You can now add preloads with `grunt config:preload`
* build: You can now write generated configs to a specified file
* build: jscs now part of testing
* build: Travis CI
* build: Standalone improvements
* build: Added NW support
* build: Updated X11 support
* build: Added debian package build support
* build: Removed deprecated Grunt tasks
* doc: Updated copyright to 2016
* doc: Ensure consistency in code license headers
* doc: Updated codebase docs
* doc: Updated README
* doc: Updated INSTALL
* doc: Updated CONTRIBUTING.md
* doc: Updated doc/NW.md
* doc: Updated doc/X11.md
* doc: Updated doc/*-handler.md

# 2.0.0-alpha70

Tons of improvments to build system, bugfixes and general improvements.

Also added proper server-side Unit Testing via Mocha :)

Remember: Run `grunt` after updating

* CoreWM: Prevent error in init() for some plugins
* CoreWM: Clock now has static with (calculated)
* CoreWM: Fixed animations (stylesheet was wrong)
* Settings: Added dummy API for testing purposes
* FileManager: Prevent exessive VFS::scandir() calls
* Window: Now has _loaded attribute
* GUI: Improvments to Menu touch handling
* GUI: Added Scheme::findDOM()
* GUI: FileView now triggers error on VFS::scandir() failure
* GUI: FileView no longer shows 'null B'
* VFS: Added VFS::getRootFromPath() to get xxx:/// from path
* VFS: Fixed VFS::scandir() for applications:///
* API: Added API::getConfig() shortcut to get by path (ex: VFS.mountpoints.shared.enabled)
* Utils: Cleaned up Utils::preload()
* Dialogs: File dialog now checks for what buttons to bind to prevent error logs
* Dialogs: File dialog now resets dropdown properly on errors
* SettingsManager: You can load pools from src/conf
* windows-live-api: Properly handle errors on initialization
* server-node: Cleanups, Split of files
* server-node: VFS fileinfo() now returns relative path
* server-node: Now possible to disable logging
* server-node: Added 'node supervisor' support
* server-php: VFS fileinfo() now returns relative path
* config: Cleaned up configuration tree entirely
* build: Added 'dist' task (shortcut)
* build: Added 'dist-dev' task (shortcut)
* build: Added 'watch' task support
* build: Grunt now fails with error when failing parsing of src/conf
* build: Handler is now preloaded effectively removing need for updating index.html
* build: Added 'iframe' type to 'create-package' task
* build: Added server-side unit testing with Mocha JS
* doc: Updated docs
* doc: Removed deprecated template files
* doc: Updated README
* doc: Updated INSTALL
* misc: jshint

# 2.0.0-alpha69

* CoreWM: Notification Icon improvments
* GUI: Button now supports `tooltip` property
* GUI: `Scheme` can now be loaded from String
* GUI: Added `scrollIntoView` for 'TreeView'
* GUI: 'ListView' now supports label via function
* GUI: 'PanedView' vertical support
* GUI: Added 'Expander'
* GUI: Window dimension can now be set via `Scheme` file
* GUI: Added `Scheme::getHTML()`
* GUI: 'FileView' now hides File Extension if requested
* GUI: 'FileView' now has default context menu
* GUI: You can now call `Element::fn(name, args)` for custom functions
* GUI: Improvments to DOM Element argument setting
* Dialogs: 'File' now handles VFS options
* Dialogs: 'File' now watches for VFS options changes
* FileManager: Now handles VFS options
* Settings: Now supports settings VFS options
* Settings: Now watches for VFS settings changes
* API: getProcess() now supports getting py `pid`
* VFS: Added `showFileExtensionis` option
* VFS: Added `showHiddenFiles` option
* VFS: Settings now reachable via SettingsManager
* PackageManger: General improvments
* Utils: Split up namespace into individual files
* Core: Support for Iframe messaging
* server-php: Fixed fallback MIME support
* build: Cleanup in client config
* build: Improvments to template files
* build: 'create-package' now supports Extensions and Service type
* build: Moved 'repositores.json' to `src/conf/000-base.json`
* build: Moved 'mime.json' to `src/conf/130-mime.json`
* build: Themes are now set in `src/conf/112-temes.json`
* build: You can now dump config with `grunt config-view`
* build: Support for symlinks in build scripts
* build: Grunt 'all' task now compiles index.html
* Misc: jshint
* Misc: removed deprecated files
* Misc: Added Travis build status
* Misc: Updated README
* Misc: Updated documentation
* Misc: Updated .bithoundrc

# 2.0.0-alpha68

* VFS: Small fixes to mounting
* CoreWM: Force merging of default settings to prevent errors when loading old user settings
* CoreWM: Added 'Fullscreen' toggle (Thanks @rontav)
* CoreWM: Added 'icon' setting for the main application button
* API: Moved Application::_call() to Process::_call()
* API: You can now specify if you want to show loading indicator on _call()
* GUI: Menu now supports HTML type entries
* Utils: Prevent error on content-type in ajax()
* UX: Improve clickable areas for certain areas (Thanks @rontav)
* UX: Improve IFrame Application mouse handling
* UX: Login screen improvments
* node: Added debugging
* config: AutoStart defined processes loaded before session
* config: Updated MIME database
* build: moved settings.json to src/server/
* build: 'Service' type package is now always singular
* build: You can now specify template for dist/ and dist-dev/ files
* Misc: Github bugreport improvments
* Misc: Fixed typo in readme

# 2.0.0-alpha67

* Utils: ajax() fixes for IE
* Utils: ajax() now assumes json content-type on object data
* Utils: Some updates to touch event handling (#112)
* CoreWM: Themes now include support for custom javascript. Small cleanups
* CoreMW: Split settings to its own file
* CoreWM: Improved settings handling
* GUI: FileView prevent error on missing filename
* VFS: Apps module no longer returns extensions on scandir()
* VFS: Removed / public directory. Replaced with mountpoint
* VFS: Added 'enabled' attribute to mountpoint configs
* API: Made sure getDefaultPath() returns osjs:/// by default
* SettingsManager: Stricter checking on set() methods
* SettingsManager: Warning on set() errors
* Window: onKeyEvent() now returns boolean
* Window: destroy() now returns boolean
* build: Fixes for Firefox Standalone
* build: Fixes for Standalone Scheme loading
* build: Fixes for Package Extensions
* build: fonts task now also copies the resources
* build: less errors now triggers grunt fail (Fixes #163)
* server-node: Added some parameters to Application API callback
* server-node: Now notifies when it is running with a message
* Locale: Updated nl_NL
* Misc: Added "Roboto" Font
* Misc: Added CONTRIBUTING.md file
* Misc: Updated README
* Misc: Updated INSTALL
* Misc: Optimize PNG files
* Misc: Updated some stamps
* Misc: Started on an official Arduino build

# 2.0.0-alpha66

* Core: Now showing application splash screens by default
* Core: Better Event unbinding
* Core: Login screen now implemented by default and handlers toggles it
* GUI: Updated range inputs
* GUI: Updated login screen
* GUI: Radio/Checkbox updates
* GUI: Bugfix for UIElement::blur()
* GUI: Updated icons
* CoreWM: Default background is now osjs purple
* CoreWM: Split up PanelItemButtons into separate => PanelItemAppMenu
* CoreWM: Some bugfixes and improvments in UI
* CoreWM: Cleanups
* VFS: Added progress dialog support to write() (#49)
* VFS: Added onprogress() for write() read() options
* SettingsManager: Added method for clearing a pool (#49)
* SettingsManager: Fixes and cleanups
* Settings: You can now hide packages (#49)
* WindowManager: Cleanup
* MusicPlayer: Correctly align buttons
* Settings: Now restores last view, bugfixes
* Build: grunt-jshint now also checks packages
* Build: Added 'tmpdir' setting
* server-node: Bugfixes
* server-node: Added PAM handler module
* server-node: Now supports custom tmpdir
* Misc: Updated installer (#158)
* Misc: package.json update
* Misc: Updated splash image/logo
* Misc: Added NW.js session support
* Misc: Added houndci configs
* Misc: Relative paths in index.html for dist's
* Misc: Fixed some memory leaks (Detached DOM elements)
* Misc: Improved some documentation
* Misc: linting and general improvements
* Misc: Updated README
* Misc: Update homepage

# 2.0.0-alpha65

Massive cleanups and refactors. This brings us a lot closer to a Beta release!

A special shout-out to @RyanRiffle for helping out with the development and making improvements to OS.js.

* Window: Now checks if given arguments is of correct instance
* API: Removed OSjs.Compabilty tree (been deprecated for a while)
* API: Renamed API.getDefaultPackages() to Core.getManifest()
* API: Renamed API.getDefaultSettings() to Core.getConfig()
* Core: Taken care of some long-stang TODOs/FIXMEs
* Core: Entirely new Settings subsystem
* Settings: Changed title of application
* Installer: Updated Windows installer
* Utils: Added Utils::pathJoin()
* Build: Removed "Core" client config namespace (collapsed)
* Build: Fixed a bug in index.html creation
* Build: Added 'grunt-time'
* CoreWM: Buttons can now be added/removed from panel (dnd and contextmenu)
* CoreWM: PanelItem now has full settings abstraction finished
* CoreWM: Changed windowswitcher shortcut
* CoreWM: Clock settings
* CoreWM: Cleanups
* Themes: Moved window border size to a custom variable
* Themes: Changed default arrow color in TreeView
* Themes: Fixed some miscalcualted values
* Themes: Lighter default zebra stripe
* Themes: Fixed hilite on zebra bug
* GUI: FileView TreeView now actually branches
* GUI: Disabled state for createMenu() entries
* GUI: Fixes to UIScheme implementation
* Misc: Handler now merged with most of the old helper classes
* Misc: Renamed some labels from "OS.js-v2" to "OS.js"
* Misc: Split up 'gui.js' into individual files
* Misc: Rewritten the "boot" process
* Misc: Updated some metadata files
* Misc: Removed 'session' namespace
* Misc: Split up some source files
* Misc: Updated documentation
* Misc: Complexity reduction
* Misc: Removed four classes
* Misc: Removed 20+ methods
* Misc: Updated jshintrc
* Misc: Updated INSTALL
* Misc: Updated Vagrant
* Misc: Updated README
* Misc: Linting

# 2.0.0-alpha64

A bunch of updates, new building system and bufixes.

* CoreWM: Fixed background bug for iOS
* Writer: Updated with more features
* Draw: Now has onChanged (alert when closing changed work)
* FileManager: Added navigation buttons and text input
* FileManager: Better side view toggling
* FileManager: Updated menus
* Dialogs: Added Alpha channel to Color dialog
* Dialogs: File dialog now toggles OK button
* GUI: IconView now has accurate up/down keys
* GUI: Added more LESS variables for theming
* GUI: Added .create() abstraction
* GUI: TreeView styles updated
* GUI: TreeView fixed selection bug
* GUI: ListView now supports zebra stripes
* GUI: Switch now has better click detection
* UI: Added Tabindex (supports all elements)
* UI: Schemes can now be cached (adds file:/// support again)
* UI: Window resizer has been fixed
* Utils: Better touch compability
* VFS: Fixed write() bug where empty content caused "data:" to be the content
* Build: Re-added standalone build mode
* Build: Completely rewritten Grunt build system
* Build: Compress build now checks if already compressed
* Build: Reduced complexity of some `conf/` files
* Handler: Demo handler now resets settings every version bump
* Misc: Automatically refocus last window when dialog closes (within reason)
* Misc: Some TODO fixed
* Misc: Some FIXME fixed
* Misc: Linting
* Misc: Cleanups
* Misc: Docs updated
* Misc: Installation instruction cleanups and updates
* Misc: Better splitting of codebase in `src/`
* Misc: Removed some unused files

# 2.0.0-alpha63

New features, bugfixes and other improvments.

* CoreWM: Updated context menu for desktop
* CoreWM: Updated context menu for panel
* CoreWM: Added 'Weather' panel item
* CoreWM: Adding launchers by DnD is supported again
* CoreWM: Now using white icon on launcher button
* Locale: Added Spanish es_ES
* Locale: Misc updates
* API: Added API::createNotification() shortcut
* GUI: DataView improvments
* VFS: Added 'Apps' module
* FileManager: Added support for 'Apps' VFS module
* FileManager: Menus now toggle based on context
* FileManager: Added confirmation dialogs
* FileManager: Added vfsEvent
* Themes: Added 'Windows 8' Theme
* Themes: Added 'Glass' Theme
* Dialogs: Confirm now supports HTML messages
* Dialogs: Confirm now has 'buttons' argument
* UI: Updated theming support
* UI: Fixed font ordering (IE was having trouble)
* UI: iOS rendering now working (old flex model)
* Misc: Cleanups
* Misc: Linting
* Misc: Documentation updates
* Misc: Moved 'gendoc' to the gh-pages branch
* Misc: Removed a npm dependency

# 2.0.0-alpha62

**BIG CHANGES TO THE API. THIS WILL BREAK YOUR APPS**

**A HUGE THANKS TO THE COMMUNITY FOR TESTING AND HELPING OUT**

- All UI interfaces now uses CSS flexbox to dynamically (and correctly) fill content
- Updated touch support abstraction to pave the way for multitouch etc
- Collapsed some settings in `scr/conf` for simplification
- Completely new DefaultApplication abstraction
- Completely new GUI (with new elements)
- Completely new Dialogs
- Rewritten Application
- Rewritten Core CSS
- Rewritten Theming
- Removal of code
- Optimizations
- Cleanups
- Bugfixes

*Removed almost 8K lines of code in total*

*300+ commits, 5 issues closed and 10 user requests also in this update*

# 2.0.0-alpha61

Bugfixes, Date library and improvments to Windows deployment.

* API: Added Application::_getArguments()
* google-api: Updated authentication failure states
* google-api: Better library loading
* Utils: Added Utils::$remove()
* Utils: Added 'indexedDB' to getCompability()
* GUI: Added 'editable' to Richtext arguments
* GUI: Disabled menu entries no longer trigger submenu (if any)
* user-session: Restored applications now get '__restored__' launch argument
* Helpers: Added Helpers::Date()
* Grunt: Small fixes to build clearing
* Locales: Added some new en_EN strings
* server-node: Fixed Windows paths breaking server configuration parsing
* server-php: Dynamic path handling instead of static/configured URI
* apache: Dynamic root path handling in htaccess
* Misc: Linting
* Misc: Removed most of the symlinks from `dist-dev`
* Misc: Removed unused files
* Misc: Updated package generation templates
* Misc: Moved some files around (safe)
* Misc: Updated INSTALL
* Misc: Updated javascript code documentation headers
* Misc: Updated bithoundrc and gitignore

# 2.0.0-alpha60

Bugfixes, build system updates, size reduction, new API helpers, touch event compabiltiy.

Also features the new IFrame Applications which help developers EASILY create applications that not
relies on OS.js APIs. You can convert your existing JavaScript application in no-time :)

https://os.js.org/doc/tutorials/iframe-application.html

* API: Added IFrameApplication helper
* API: Added IFrameApplicationWindow helper
* Core: Updated tuch event compability (#112)
* Core: dist now has split locales file due to compability
* Utils: Reworked touch detection
* CoreWM: Now using touch menu as default on touch systems
* CoreWM: Default Application menu now has className in DOM
* CoreWM: Fixed pseudo element CSS reset on applySettings()
* Session: Add yes/no/cancel button to logout dialog (Fixes #124)
* server-node: Added nodejs exampe handler (#120 , #11)
* server-node: Fixed scandir() on Windows
* server-php: Added dynamic rootpath for file reading
* Grunt: Fixed font generation
* Grunt: Added arguments for theme building (like specify which theme to build only) (#96)
* Grunt: Added arguments for package building (like above) (#96)
* Grunt: Now uses uglify-js for javascript minification (#96)
* Grunt: Now uses min-css for stylesheet minification (#96)
* Misc: Added Windows installer source
* Misc: Windows installer can now install to custom defined directory
* Misc: Automated installer now installs npm dependencies
* Misc: Better support for "webhost" deployment
* Misc: Updated some docs
* Misc: Removed some unused files
* Updated README
* Updated INSTALL
* Updated package.json
* Updated gitignore

# 2.0.0-alpha59

Thanks to the community this release contains a lot of bugfixes and useful additions.

Also done some effort in reducing the complexity of the code.

* Locales: Added Vietnamese (vi_VN). Thanks Khoa :)
* Locales: Cleanups
* API: Workaround for Win 8.x touch false positive
* API: Moved user packages to ~/.packages
* VFS: You can now filter dotfiles in scandir()
* GUI: FileView added dotfile handling
* CoreWM: Unknown category renamed to Other
* CoreWM: Bugfix in IconView not casting to VFS.File()
* CoreWM: You can now drag applications from the menu to desktop as shortcuts
* Dialogs: File dialog now has Home button
* Dialogs: Fixed infinite loop on error in file dialog
* Dialogs: Fixed file dialog for locally running instances
* Windows: Fixed context menu icons
* VFS: Fixed rename bug (typo in function call)
* utils.js: Added function for default argument resolvment
* utils.js: Fixed an ignored error
* utils.js: Cleanups and complexity reduction
* session.js: Cleanups and complexity reduction
* api.js: Cleanups and complexity reduction
* guielement.js: Cleanups and complexity reduction
* window.js: Cleanups and complexity reduction
* _input.js: Cleanups and complexity reduction
* file.js: Removed duplicate code
* build: Updated error handling
* buils: WAMP now working after config updates
* google-drive: Better error handling
* google-drive: Fixed mkdir not erasing cache
* onedrive: Better error handling
* misc: Re-introduced bin/ folder with some helpers
* misc: Removed some unused files
* misc: Updated INSTALL
* misc: Updated README
* misc: Updated docs

# 2.0.0-alpha58

* API: Introduced group permissions for API/FS calls
* Session: Added config for showing warning message when closing tab
* Misc: Bugfixes in Example handler
* Misc: Reduced complexity of some code
* Misc: Some code cleanups and removal of duplicates
* Misc: Removed some dead files
* Utils: getUserLocale() reworked
* Utils: ajax() now recognizes errors better in ArrayBuffer calls
* PackageManager: Gracefull error on user pacakges load failure
* Doc: Updated docs
* grunt: Added nginx config generation

# 2.0.0-alpha57

Standalone support (file://). Firefox Marketplace support :)

I now also started providing nightly builds

* Updated INSTALL
* Updated README
* Updated gendoc
* GUI: Added IFrame Element for much simpler app creation
* VFS: You can now add local mount points
* Helpers: Added FirefoxMarketplace (supports hosted apps)
* Applications: Added FirefoxMarketplace
* API: getIcon() now ignores http based paths
* Window: Windows with iframes now clickable (fix)
* Window: Now possible to set warnings
* Locales: Added Vietnamese (vi_VN) core translations (Thanks @khoaakt)
* Core: Now can run in standalone mode
* Build: Added nightly generator
* Misc: jshint

# 2.0.0-alpha56

Grunt is now used as build system.

Widows support :)

* Updated README
* Updated INSTALL
* Themes: Added EXPERIMENTAL "Frosty Mint" theme with Windows Glass-like effect #82
* Misc: Minor bugfixes
* Misc: Updated lighttpd.conf generation
* Misc: Removed 'obt' build system
* Misc: Grunt is now used as task managment
* Locales: Added nl_NL (Dutch)
* Locales: Updated Polish (pl_PL)
* Dialogs: Fixed enter in file dialog
* GUI: ListView - Updated and removed some deprecated stuff
* CoreWM: Fixed some translation mistakes
* VFS: fileinfo() now has mtime/ctime
* MusicPlayer: Fixed file open bug #91
* FileManager: Columns now toggleable in list view


# 2.0.0-alpha55

Now features installable packages via zip or App Store in the Settings application.

For this to work you need to add zip.js support. See manuals on documentation page
on how to set up.

* PackageManager: Updated with support for user packages in home directory
* Settings: Added 'Installed Packages' tab
* Settings: Added support for installing packages via zip
* Settings: Added 'App Store' tab with an official application store
* Helpers: Added ZipArchiver helper (currently for extracting files only)
* Application: _addWindow() now has a callback argument
* VFS: HTTP Errors no longer result in successful read()
* VFS: Added a default parameter value in remoteRead()
* Dialogs: Fixed an infinite loop in color dialog
* obt: Now writes packages.json in dist
* Handler: Renamed an internal method and updated arguments
* DefaultApplication: Renamed an internal method
* ExampleHandler: Updated
* Misc: Fixed some icon paths
* Misc: Fixed some minor TODOs and FIXMEs
* Misc: Added some missing translation calls
* Misc: Updated documentation

# 2.0.0-alpha54

* Core: New core settings generation in src/conf for much easier managment (no more build.json)
* Themes: New folder structure
* Themes: Reworked the Theme settings in core #79
* Themes: You can now add custom icon themes #79
* Themes: You can now add custom sound themes #79
* Themes: You can now add custom font themes #79
* Themes: Metadata now includes some important CSS margin stuff
* CoreWM: Better Window Desktop Corner snapping #68
* Windows: Moved some event code to WindowManager
* API: getFileIcon() now only accepts OSjs.VFS.File as argument
* GUI: Fixed GUIElements not updating correctly in Tabs
* Misc: Centered loading correctly in CSS
* Misc: Cleanups
* Misc: jslint for window.WL
* Misc: Added installer.sh script to source

# 2.0.0-alpha53

* Locales: Updated russian locales (Thanks @vlad008)
* Locales: Added chinese locale (Thanks @zqqq)
* CoreWM: Now sets styles with a custom CSS sheet
* CoreWM: Now possible to set panel opacity
* CoreWM: Desktop notifications now use same colors as panel
* CoreWM: Split locales into separate file
* CoreWM: Added static icon sizes to certain elements
* CoreWM: Added support for window snapping (#68)
* Applications: Split out all locales into separate files
* GUI: Added VBox
* GUI: Added HBox
* GUI: GUIElement can now refer to it's children and parent (more for internal usage)
* GUI: Tabs now has onInserted() event
* GUI: Fixed resize header generation  in ListView
* GUI: Refactored GUISlider (#78) API Compatible, but fixes a lot of stuff
* Settings: Moved some settings around
* Settings: Added 'Debug' tab
* Settings: Added 'Touch Menu' switch (@thanks @vlad008)
* Misc: Fixed some typos
* Misc: Cross-platform CSS update
* Misc: Some minor improvments to default sizes of GUIElements

# 2.0.0-alpha52

WARNING: API Changes

* Dialogs: Fixed input dialog
* GUI: Fixed keyevents that was blocked in _DataView
* GUI: Remved ev = null blocking an event
* GUI: Added new 'Switch' element (#66)
* GUI: Added border-box sizing to all GUIElements
* GUI: StatusBar height fix
* GUI: Added defaultTab option to GUITabs
* API: Moved and renamed servicering to API.getServiceNotificationIcon()
* API: Implemented a crude clipboard
* CoreWM: Made some changes to the settings tree (simplified)
* CoreWM: Split up panel items into separate files
* CoreWM: Split menu out of main.js into separate file
* CoreWM: Added new touch based application menu (#61)
* CoreWM: Fixed background setting CSS
* CoreWM: Added fadein/out to notifications and menus
* FileManager: Added support for CTRL+C CTRL+V
* Settings: Entirely new application and implementation (#65)
* Vendor: Updated closure compiler
* Misc: Updated dialog docs
* Misc: Updated TODO
* Misc: Updated INSTALL
* Misc: Added new default wallpaper
* Misc: Fixed a typo in Vargantfile (#67)
* obt: Added max file size setting to server-php
* obt: Now strips all comments and wasted newlines on dist

# 2.0.0-alpha51

WARNING: API Changes

API Namespace cleanups, file splitting and documentation

References: #12, #13, #55, #59

* Updated client source-code documentation
* Updated document generation tool
* Dialogs: Refactored buttons (#13)
* Misc: Split up core.js (#55)
* Misc: Renamed some files
* Misc: Split up more js and css files
* Misc: Moved API functions around (#59)
* Misc: Moved API functions around again (no issue)
* Misc: Removed a lot of "global" variables

# 2.0.0-alpha50

New Logo and Homepage :) Documentation update and some fixes

References: #12

* GUI - Toolbar: Re-added toggleable (Thanks @RyanRiffle)
* Docs: Added to all core js files
* Docs: Added to all gui js files
* Docs: Added to all dialog js files
* Docs: Added documentation generator
* CoreWM: You can now style panel opacity and background color
* VFS: Aborts if file is to big upon upload before sending to server
* New logo
* jslinted

# 2.0.0-alpha49

WARNING: API CHANGES. All helper functions have been moved into `OSjs.API`

References: #45, #44, #50, #51, #53

* Makefile: Added 'test' (no unit testing yet)
* Core: Moved Handler::curl() to API::
* Core: Moved Handler::getApplicationResource() to API::
* Core: Moved Handler::getThemeCSS() to API::
* Core: Moved Handler::getIcon() to API::
* Core: Moved Handler::getThemeResource() to API::
* Core: Moved Handler::getFileIcon() to API::
* Core: Moved all classes used by Handler into Helpers::
* Core: Moved GUI::createMenu into API::
* Core: Moved GUI::blurMenu into API::
* Core: Moved GUI::createDroppable into API::
* Core: Moved GUI::createDraggable into API::
* Core: Moved gui.js to guielement.js
* Core: Moved gui.css to guielement.css
* GUI: Moved _DataView into separate file
* GUI: Moved _Input into separate file
* VFS: Added unmount() with signaling
* VFS: Bugfix for uploding custom files
* VFS: Bugfix for internal download
* Window: Added _getZindex()
* Window: Added 'moved' hook
* FileManager: Now recieves unmount() signals correctly
* FileDialog: Fix resetting of path on VFS::exists() error
* Docs: Full documentation of 'core.js'
* Misc: Cleanups

# 2.0.0-alpha48

NOTE: Run 'npm update' for node server :)

* Utils::ajax() fix for cross-browser after last release
* Misc: Updated copyright headers on all files
* onedrive: Added Path resolving (#43)
* onedrive: Added MIME emulation (#43)
* onedrive: Added fileinfo() (#43)
* onedrive: Added read() (#43)
* onedrive: Added write() (#43)
* onedrive: Added exists() (#43)
* onedrive: Added to build.json and dist-dev-index (#43)
* onedrive: Added localization (#43)
* windows-live-api: Improved session/auth handling and bugfixes (#42)
* API: Added curl() to server-node and server-php (#11)
* VFS: Added remoteRead()
* GUI - FileView: Improved error handling

# 2.0.0-alpha47

WARNING: This release will require you to refactor applications to use Utils.ajax()
instead of old Utils.Ajax*() methods

* Core: Destroy 'service-ring' on shutdown
* VFS: google-drive - Fixed a intermittent bug in createDirectoryList
* VFS: google-drive - Typo in configuration check caused error
* VFS: Microsoft OneDrive module included (but not enabled. HIGHLY EXPERIMENTAL #43)
* VFS: Added support for methods: trash, untrash, emptyTrash
* VFS: Added helper function to easily attach files to uploads
* Helpers: Added Windows Live API support (#42)
* Utils: Removed old Ajax() AjaxDownload() and AjaxUpload()
* Utils: One ajax() function to rule them all!
* Misc: jslint update
* Misc: cleanups

# 2.0.0-alpha46

This release fixes all the encoding problems in VFS.I should have thought of
this sooner, but using ArrayBuffer to pass around is pretty much fool-proof.

* DefaultApplication: You can now specify binary/text file handling type
* VFS: dropbox - fixed 'null' size of parent in directory list
* VFS: You can now use FileDataURL() pass as an alternative to ArrayBuffer
* VFS: Added API methods for ArrayBuffer conversions and vice-versa
* VFS: Now always passing ArrayBuffers inside js
* VFS: Now always reads files as ArrayBuffers
* VFS: Moved all locales down to vfs.js
* VFS: Cleanups
* VFS: Added some missing javascript documentation
* Core: Added 'ServiceRing'. NotificationIcon for managing API services
* Misc: jslinted

# 2.0.0-alpha45

* VFS: Cleanups
* VFS: Removed some redundant code
* VFS: Rewrote osjs module
* VFS: Generalized translation strings
* VFS: google-drive - Bugfix in upload
* VFS: google-drive - Charset fixes
* VFS: dropbox - Added fileinfo()
* VFS: dropbox - Added locales
* VFS: dropbox - Added notification icon
* VFS: dropbox - Added sign out option
* VFS: dropbox - Added parent directory in scandir() (I forgot this somehow)
* VFS: dropbox - Now uses popup auth driver

# 2.0.0-alpha44

NOTE: There is a bug in VFS causing copy of cleartext to OS.js not working properly

* VFS: Now always transfers files using ArrayBuffer if possible
* VFS: google-drive - Now caches filetree for a certain amount of time
* VFS: google-drive - Rewrote filetree handling. Solved all bugs
* VFS: google-drive - Updated locales
* VFS: dropbox - Minor improvments
* VFS: Improved copy between sources
* VFS: Cleanups
* CoreWM: Fixed contextmenu on panel
* CoreWM: Added option to invert IconView colors (uses background color)

# 2.0.0-alpha43

* CoreWM: Split lib.js into separate files (finally)
* CoreWM: Better WindowSwitcher behavior
* CoreWM: Some abstraction fixes
* CoreWM: Fixed ru locale
* CoreWM: Renamed setting storage name (NOTE: This resets your dekstop)
* Windows: Updated IFrame event blocking fixer
* Themes: Added 'flat'
* Application - Calculator: Fixed (Thanks, @danielang)
* Misc: Added Vargantfile and docs (Thanks, @CtrlC-Root)
* Misc: Updated INSTALL.md

# 2.0.0-alpha42

* Added Core de_DE translations (Thanks @danielang)
* Added Application de_DE translations (Thanks @danielang)
* Themes: Added missing icon
* Handlers: Fixed a typo after refactor (settings saving in Example handler)
* Misc: Fixed desktop scrolling causing flickering
* Application - FileManager: Fixed side view toggle
* Application - FileManager: Added 'Edit' menu to default right-click menu context
* CoreWM: Fixed upload on desktop via DnD
* CoreWM: Now removes shortcut if file is removed in IconView
* GUI: Fixed DnD to child containers inside Windows
* GUI: Cleaned up DnD of _DataView classes (finally)
* VFS: Now removing extra slashes on upload() (derp)
* Updated Apache Vhost Configurations
* Updated AUTHORS
* Updated INSTALL

# 2.0.0-alpha41

* Themes: Added 'Dark' Theme
* CSS: Added GPU rendering to windows
* CSS: Fixed flex boxes in some cases - Fixes #33
* GUI: Fix for panedview flexing and resizing
* GUI: Toolbar updates
* Windows: You can now apply window properties in constructor
* Applications: Moved 'Settings' to its own Application
* Applications: Removed BugReport application
* Applications: Added more MIMEs to some packges
* Utils: Added atobUtf() btoaUtf() atobUrlsafe() btoaUrlsafe()
* Core: hook cleanup
* server-node: Added session support (finally). Requres npm update
* server-php: Added scandir() check
* server-node: Better extendability
* locales: Updated nb_NO

# 2.0.0-alpha40

* Misc: Fixed loading problems in Firefox - #32
* Core: Autodetection of language - #23
* Core: Hooks now arrays, adding support for multiple handlers
* Utils: Added getUserLocale()
* Draw: Fix for flip effect
* Locales: Added ru_RU Application translations (Thanks @Fabel) - #18
* VFS: Added mounted() property
* VFS: Added readOnly propert
* VFS: Fixed exists() in GoogleDrive
* VFS: Now sends mounted/unmounted message to procs
* FileManager: Added opacity for unmounted volumes
* server-node: Removed old error message

# 2.0.0-alpha39

* WM: Added getWindow(name)
* Core: Extended keyboard handling support in windows etc.
* Windows: Added return on _close()
* Windows: _onChange() now has byUser parameter
* obt: Added some more namespaces to templates
* obt: Fixed including preload items in extensions
* obt: Config file now includes API extension modules
* obt: Now preloading extensions instead of updating template (less overhead)
* server-php: Much better extendability
* GUI - Label: Removed default label
* VFS: Updated compability
* VFS: Added new parameters
* VFS: Added detection of arrayBuffer usage
* VFS: Added Dropbox module from Experimental repo
* VFS: Fixed UTF encoding problems (#30)
* Misc: added vendor/ to dist
* Misc: added utf-8 to apache configs when serving JS
* Misc: jslint

# 2.0.0-alpha38

* Updated README
* Updated AUTHORS
* Windows: Minor cleanups
* Windows: Fixed (somewhat) iframes in windows blocking certain events
* Misc: Collapsed some namespace calls
* Locales: Added new de_DE translations
* Locales: Added French fr_FR Core translations
* Locales: Added Russian ru_RU Core translations
* FileManager: Label bugfix
* Core: Added AutoStart config support

# 2.0.0-alpha37

* Locales: Added formatting string for entire OS.js, so now translations should be a breeze :)
* Locales: Entirely new en_EN
* Locales: Entirely new no_NO
* Locales: Disabled de_DE for now (waiting for new translations)
* Utils: Fixed a tiny memory leak in getCompability()
* Utils: Renamed HEXtoRGB => convertToRGB
* Utils: Renamed RGBtoHEX => convertToHEX
* VFS: Added options parameter to write/scandir/upload
* VFS: Removed _opts entirely from API (finally)
* DefaultApplication: Removed static paths

# 2.0.0-alpha36

* server-php: Now blocks all VFS write request on osjs://
* server-node: Fix for upload
* DefaultApplication: Added argument passing to save functions
* DefaultApplication: Fixed bug on save where currentFile is reset
* Utils: Added 'file' and 'blob' to compability list
* Utils: Added more keycodes
* FileManager: F2 to rename
* FileManager: DELETE to delete
* FileManager: Added error dialog on upload error
* FileManager: Added Download to context menu
* New README
* New Logo!

# 2.0.0-alpha35

* VFS: Fixed download() across all modules
* VFS: Better error handling for file uploads
* VFS: Added existence checks on common methods
* CoreWM: Added click() to panel item notification icons, same as contextmenu()
* WindowManager: You can now resize a window in all directions
* Dialogs: File dialog can now have button to create new dir
* GUI: Added zip file icon to mime
* default-application: Added support for upload on save
* default-application: Fixed setting mime on save
* server-php: Bugfix for upload in home
* server-php: Removed a exists() check
* server-node: Added support for custom handlers
* locales: Moved some more strings
* locales: Updated locales

# 2.0.0-alpha34

WARNING: API Change

* New Application Manifest layout (collapsed, finally)
* obt: buildPackages() now only does the ones that are actually enabled
* obt: You can now specify which files to copy into dist in metadata (whitelist) Makes building much faster
* VFS: Changed desktop notification message
* Core: Collapsed OSjs.Hooks into OSjs.Core.hooks
* Core: Moved tranlation functions to OSjs.API._()
* Core: Moved locale functions to OSjs.API.*
* Misc: Moved version stamp into build.json

# 2.0.0-alpha33

* Themes: Custom WebKit scrollbar styles
* Themes: Small fixes for custom input element styles
* Core: Remove Settings namespace
* Core: Moved default settings method to API.getDefaultSettings()
* Core: Removed Drivers namespace
* Core: Moved 'indexed-db' to Helpers
* Core: Moved 'google'api' to Helpers
* server-php: Bugfix for osjs:/// file reading (i forgot decoder)
* CoreWM: Fixed WindowSwitcher
* CoreWM: You can now DnD on to Windows in PanelItemWindowList, including peeking
* GUI: Removed input tabindex (set to -1 for disable)
* Windows: Added real tabindex (custom code)
* jslint and small cleanups
* DefaultApplication: Fixed save dialog default path

# 2.0.0-alpha32

* Added reverted version of repositories.json file
* Core: Updated manifest support for Extension type packages
* Core: Removed old compability code
* Core: Jslint
* Core: Fixed a crazy ass bug where _HANDLER was lost on boot (undefined)
* Core: Added signout()
* Core: Added IndexedDB driver
* VFS: Now emitts application messages globally on all vfs functions
* DefaultApplication: Now shows a dialog if file has changed on vfs emitt trigger
* Utils added JSONP support
* CoreWM: Small fix for bubbling of events in panel items
* CoreWM: Now displays notifications so it does not block panels
* google-api: Added support for revoking permissions
* google-api: Added notification icon
* google-api: Moved to namespace Drivers
* google-drive: Bugfix for mkdir()
* Themes: Updated desktop notification styles
* GUI: Custom styling for SELECT
* GUI: Custom styling for CHECKBOX
* GUI: Custom styling for RADIO

# 2.0.0-alpha31

* Application - FileManager: Now displays notification about login to external services
* Application - FileManager: Rename dialog now automatically highlight filename-ext
* Dialogs - File: Moved to new Utils::getFilenameRange()
* Utils: Added getFilenameRange()
* Dialogs - Input: Added callback for _inited()
* google-drive: Added support for fileinfo()
* google-drive: Added support for move()
* google-drive: Some error prevension
* google handler: Updated error handling
* VFS: Added support for move() on all modules -- i forgot
* Core: Added Utils::replaceFilename()
* obt: Bugfix for 'make core' with extension
* General: Linting after all changes

# 2.0.0-alpha30

* VFS: Split User/Public modules into separate files
* VFS: Added 'internal' property to modules
* VFS: Added Folder support to Google Drive
* VFS: Now always sends base64 encoded data on transfer with read()
* VFS: Fixes for transfer between sources
* server-node: Fixed a bug where index.html was not loaded
* Dialogs - File: Autoselect filetype in dropdown correctly
* Dialogs - File: Fixed selection of filetype on input
* DefaultApplication: Now checks if filetype is valid on save() and replaces extension if nesecary
* Windows: Added 1ms to getAnimDuration(). Fixes Chrome bug where resized hook triggers too soon

# 2.0.0-alpha29

* VFS: Bugfixes for upload
* VFS: Bugfixes for copying between sources
* VFS: Code cleanup
* VFS: Better upload handling
* server-node: Added a temporary fix for default home path

# 2.0.0-alpha28

* VFS: Now fully supports home directories pr user
* VFS: Now has a "public" directory for general file sharing
* VFS: Changed default path to home://
* API: Moved Google API to handlers/

# 2.0.0-alpha27

* VFS: Added support for osjs://
* VFS: Rewrote scandir()
* obt: Added support for extending core via packages of type "extension"
* Application - Textpad: Added more mime types

# 2.0.0-alpha26

* Templates: Removed some deprecated stuff
* VFS: Fix for empty File construct
* VFS: GoogleDrive fixes
* VFS: Copy/Move between different sources
* VFS: Download method for all sources
* Utils: Fixed dirname() for uri with protocol
* Utils: Added urlsafe base64 encode/decode
* Dialogs: Fixed directory listing bug in File dialog
* Core: Better error/exception handling

# 2.0.0-alpha25

* VFS: Moved server-side code into client
* VFS: GoogleDrive improvments
* VFS: Better error handling
* VFS: Moved all configuration to build.json
* Themes: Added Google Drive icons
* Application - Draw: Updated VFS support
* Dialogs - File: Now selects appropriate VFS module in selection box
* obt: Added support for custom build.json files
* obt: Prevent crash on repo dir non existent

# 2.0.0-alpha24

WARNING: API Change

* VFS: New VFS wrapping
* VFS: Google Drive integration
* API: You must now pass an object around for files
* API: Moved ALL file functions to VFS namespace
* Dialogs: ApplicationChooser crash prevension on arguments
* CoreWM: Fixed IconView style
* CoreWM: Added Desktop context menu to IconView
* CoreWM: Fixed a hook in IconView
* Themes: Removed deprecated loading GIFs
* GUI: Finished PanedView

# 2.0.0-alpha23

* Version stamp now created on startup
* Application - Draw: Now uses extended namespaces
* Application - CoreWM: Now uses extended namespaces
* Application - FileManager: Sidebar bugfix after previous bump
* GUI - FileView: Fixed filesize sorting

# 2.0.0-alpha22

* Added automated installer
* Updated INSTALL instructions entirely
* Core: Refactored to use forEach() loops instead of the traditional way
* GUI: FileView bugfixes for iconview and treeview
* Dialogs: File dialog bugfixes relating to GUIFileView

# 2.0.0-alpha21

WARNING: API Change

* Core: Removed 'Main' Class
* Core: Refactored Application::init(core, settings, metadata) => Application(settings, metadata)
* Core: Slimmed down and cleaned up
* Core: Fixed some bugs coming from reports where some vars was undefined
* Core: Hooks are now checked before assigning noop
* GUI: Vertical slider is now inverted
* Sessions: Windows with resize disabled will not be restored to previous size on load
* Dialogs - File: Fixed the filename highlighting in save dialog
* API: You can now have a namespace in OSjs.Applications and set the main class to OSjs.Applications.MyApp.Class
* CoreWM: Fixed getThemes()
* CoreWM: Do not apply theme if name is empty
* Utils: Added AjaxDownload() and global API shortcut downloadFile()
* Application - ProcessViewer: Fixes for the listview
* obt: Fix for htaccess generation
* obt: Now uses local npm packages instead of global
* Added package.json for npm
* Updated install instructions -- simplified

# 2.0.0-alpha20

* Core: Split Widow and WindowManager etc. into src/javascript/windows.js
* Core: Split init code into src/javascript/main.js
* Core: Moved some code from core.js into handler.js
* Windows: Possible fix for some errors on touch devices when closing window while moving
* Applications: Added strict
* DefaultApplication: Some improvments
* obt: Can now generate dist-dev/index.html
* Updated lint and some docs

# 2.0.0-alpha19

* Completely new build tools: 'obt' aka 'OS.js Build Tools'
* New build tool replaces all bin/ scripts
* obt can now handle package repositories
* Better abstraction for Handlers
* Simplified and Cleaned up Handlers
* Prepared for WebSockets
* New INSTALL instructions

# 2.0.0-alpha18

* New build tools (replaces all bin/ scripts)
* GUI: Bugfix for multiple events firing in IconView and ListView
* GUI: Textarea etc. now supports placeholder
* GUI: Bugfix for Input blur/focus after destruct
* Misc: Fixed a couple of detached DOM objects
* Misc: Fixed some memory leaks
* Application - Bugreport: Increased sizes of fields
* Updated docs

# 2.0.0-alpha17

* Locales: Now falls back to system default language when not found in dict
* Core: Added lots of hooks for custom custom integration stuff
* Core: Removed _addEvent() and migrated code
* CoreWM: Moved some code from Core, some abstraction updates
* Utils: Added middle button detection to mouseButton()
* Misc: Moved some MIME stuff around
* Misc: Console messages now removed from dist builds
* Misc: Google Closure Compiler now default for Core

# 2.0.0-alpha16

* jslint: Core code is now acceptable
* php-webserver: Fixed for internal server bugs remaining from refactors
* GUI: Bugfix for ListView dblclick (typo in refactor :()
* GUI: Bugfix for IconView dblclick (typo in refactor :()
* Updated licences and headers
* Applications: Bugreporting is now a standalone application
* DefaultApplication: Small fixes for error handling
* CoreWM: Updated status notification colors

# 2.0.0-alpha15

* Utils: Added $createCSS
* Utils: Added $createJS
* Utils: Added AudioContext to getCompability()
* Window::_resizeTo() has been recoded
* Bugfix for DnD hanging windows on some browsers
* Application - Calculator: Bugfixes from reports
* Application - Writer: Small updates
* Themes: New panel style (default)
* Tonnes of jslint updates

# 2.0.0-alpha14

* Code syntax fix for compressed/combined dist
* New DefaultApplication class
* New DefaultApplicationWindow class
* Fixed Window loadig indicator position
* Fixed Window maximization
* Updated locales
* Application - Calculator: Cross-browser fixes
* Fixed IE CSS loading for WM (seriously IE....seriously?!)

# 2.0.0-alpha13

* Themes: Refactored theming
* Windows: The given dimensions will now work correctly
* Backend: Bugfixes for PHP
* Applications: Small fixes for dimensions
* dist: Fixed xmpp stuff
* Helpers: Moved UploadFiles and SettingsManager to OSjs.API
* Helpers: New DefaultApplication
* Helpers: New DefaultApplicationWindow

# 2.0.0-alpha12

* Node.js backend refactor and cleanup
* Node.js file upload support
* Updated documentation
* Cleaned up new PHP backend code
* settings.php now required without checking for existence
* GetFile bugfix in PHP backend
* Applications: Added Calculator
* GUI: Added more input events to the GUIInput type

# 2.0.0-alpha11

* Added window property "start_focused"
* Updated .gitignore
* Application - Draw: Switched default colors
* Application - FileManager: Added min-size to file view
* GUI - ListView: Added width in CSS for header table
* Dialogs - Font: Fixed height of window
* Backend: Bugfix for bugreport function
* Updated locales
* Rewrote the PHP backend - unified and OO for requests etc!
* OS.js now has a logo (temporary)!
* New loading screen!

# 2.0.0-alpha10

* Updated some documentation
* New README file for repo
* Updated INSTALL instructions
* CoreWM: Notification Area updates
* CoreWM: Clock Panel Item has been fixed for all platforms
* Dialog: FileUpload bugfixes
* Core: Fixed bug where no errors were reported on fail starting WM
* X11: Small fixes in CSS for compability in libwekbit3
* Themes: Now supported in build system
* Themes: Now uses manifest file like packages
* Makefile: Updated colors

# 2.0.0-alpha9

* Application - Draw: Small updates
* Build-system: Update compression script
* Build-system: Combine sources for 'dist' build
* Build-system: Cleanups and small fixes
* CoreWM: Added NotificationArea panel item
* CoreWM: Added busy/startup notifications
* CoreWM: Split CSS files
* CoreWM: Resume loading panel-items if queue fails (bufix)
* CGI: Update .htaccess rules for builds


# 2.0.0-alpha7 to 2.0.0-alpha8

* Cleaned up some old code
* Updated translations
* GUIFileView bugfixes
* GUIStatusbar bugfixes
* Updated the includer login handler
* Updated custom handler support
* Application - Draw: Many updates
* Updated documentation

# 2.0.0-alpha4 to 2.0.0-alpha6

Build system improvments, cleanups, bugfixes and documentation updates.

Also removed the default submodules and added them to the master filetree.

# 2.0.0-alpha3

A bit more modular design for the filetree. Created a Makefile for doing all build stuff.
Some cleanups and documentation updates

# 2.0.0-alpha1

Rewritten from scratch!

