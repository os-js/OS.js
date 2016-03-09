/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';
    
function showErrorSDCard(wind){
    OSjs.API.createDialog("Alert", {title:"Error", message:"No SD Card detected, the app will be closed"}, function(){ wind.destroy(); });
}
    
function showErrorMount(wind){
    OSjs.API.createDialog("Alert", {title:"Error", message:"Can't mount the microSD card, the app will be closed"}, function(){ wind.destroy() }) // Close app ?
}

function showPivotDone(wind){
    OSjs.API.createDialog("Alert", {title:"Done", message:"Pivot Overlay accomplished ! Your system will be rebooted!"} , function(){
        //wind._toggleLoading(false);
        OSjs.API.call('reboot', {}, function(){window.setTimeout(function(){wind._toggleLoading(false); location.reload();}, 50000)} );
    });
}

function showPivotRevertDone(wind){
    OSjs.API.createDialog("Alert", {title:"Done", message:"Pivot Overlay reverted ! Your system will be rebooted!"} , function(){
        //wind._toggleLoading(false);
        OSjs.API.call('reboot', {}, function(){window.setTimeout(function(){wind._toggleLoading(false); location.reload();}, 50000)} ); 
    });
}
    
function showFormatSDDone(wind){
    OSjs.API.createDialog("Alert", {title:"Done", message:"SD Formatted ! Your system will be rebooted!"} , function(){
        OSjs.API.call('reboot', {}, function(){window.setTimeout(function(){wind._toggleLoading(false); location.reload();}, 50000)} ); 
    });
}

function showExit(wind){
    OSjs.API.createDialog("Alert", {title:"Goodbay", message:"Good Bye for now..."} , function(){
        wind.destroy();
    });
}  
    
function showRevertError(wind){
    OSjs.API.createDialog("Alert", {title:"Error", message:"Error during pivot revert"} , function(){
        wind.destroy();
    });
}  

    
function verifyFdisk(wind, scheme){
      OSjs.API.call("checkFdisk", {} , function(res, req){
          if(!res.error && res.result.indexOf("fdisk")>-1 ){
              start(wind, scheme);  
                //bindMenu(win, scheme); 
            }
            else //if fdisk is not installed
                OSjs.API.call("opkg", {"command" : "install" , "args": {"packagename" : "fdisk"} }, function(){verifyFdisk(scheme)});
      });
  }
    
function start(wind, scheme){
    OSjs.API.call("checkMenu", {} , function(res, req){ 
          if(!res.error && res.result == 0) //0 or "0" ????
              bindMenu(wind, scheme);
          else
              OSjs.API.call("checkSDCard", {} , function(res, req){
                    if(res.error || res.result == 0) //0 or "0" ????
                        showErrorSDCard(wind);
                    else
                        OSjs.API.call("checkMount", {} , function(res, req){
                            if(res.error || res.result == 0) //0 or "0" ????
                                showErrorMount(wind);
                        });
                });              
      });
}

function pivot(wind){ 
    OSjs.API.call("valuateMountCondition", {}, function(res,req){
                    if(!res.error && res.result == 0){ //0 or "0" ????
                        OSjs.API.createDialog("Confirm", {buttons: ['yes', 'no'], message: "All data on your SDCard Would will be erased, are you sure ?\nIt will be require " }, 
                                           function(ev, button) {
                                                    if (button == "yes") {
                                                        wind._toggleLoading(true);
                                                        OSjs.API.call("prereqs", {}, function(res, req){
                                                            //var lres = JSON.parse(res)
                                                            //if(!lres.error){ //if(res.result)
                                                            if(!res.error){
                                                                OSjs.API.call("returngigs", {}, function(res, req){
                                                                    if(res.result != "Error"){
                                                                    OSjs.API.call("formatsdcard", { size: res.result}, function(res, req){
                                                                        if(!res.error){
                                                                            OSjs.API.call("systemoverlay", {}, function(res, req){
                                                                                if(!res.error){
                                                                                    //wind._toggleLoading(false);
                                                                                    showPivotDone(wind);
                                                                                }
                                                                            });
                                                                    }
                                                                    });
                                                                }
                                                                    else{
                                                                        //Get Error Message and Exit
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    } 
                                                    else 
                                                    {
                                                    //Exit application
                                                        showExit(wind);
                                                    }
                                        }); 
    }
    });
}

function revertpivot(wind){
    OSjs.API.call("valuateRevertCondition", {}, function(res,req){
        if(!res.error && res.result == 0){ //0 or "0" ????
            wind._toggleLoading(true);
            OSjs.API.call("revert", {}, function(res,req){
                if(!res.error){
                    //wind._toggleLoading(false);
                    showPivotRevertDone(wind);
                }
            });
        }
        else{
            showRevertError(wind);
        }
    });
}    
    
function formatsdcard(wind){
    OSjs.API.call("valuateMountCondition", {}, function(res, req){
        if(!res.error && res.result == 0){ //0 or "0" ????
            OSjs.API.call("valuateVfatCondition", {}, function(res, req){
                if(!res.error && res.result == 0){ //0 or "0" ????
                    wind._toggleLoading(true);
                    OSjs.API.call("formatonly", {}, function(res, req){
                        showFormatSDDone(wind)
                    })
                }
                else{
                    OSjs.API.call("valuateFormatCondition", {}, function(res, req){  //TODO
                        alert("Pivot Overlay is still enabled, please first disable it")
                    })
                }
            })
        }
    })
}
    
function bindMenu(wind , scheme){
    scheme.find(wind, 'pivotButton').on('click', function(){pivot(wind);});
    scheme.find(wind, 'revertButton').on('click', function(){revertpivot(wind)});
    scheme.find(wind, 'formatsdButton').on('click', function(){formatsdcard(wind)});
    scheme.find(wind, 'exitButton').on('click', function(){ wind.destroy();});
    
    scheme.find(wind, 'pivotButton').set("disabled", false);
    scheme.find(wind, 'revertButton').set("disabled", false);
    scheme.find(wind, 'formatsdButton').set("disabled", false);
    scheme.find(wind, 'exitButton').set("disabled", false); 
}
    


  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationFSExtenderWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationFSExtenderWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);
  }

  ApplicationFSExtenderWindow.prototype = Object.create(Window.prototype);
  ApplicationFSExtenderWindow.constructor = Window.prototype;

  ApplicationFSExtenderWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'FSExtenderWindow', root);
    
    scheme.find(this, 'pivotButton').set("value", OSjs.Applications.ApplicationFSExtender._("PIVOT_LABEL"));
    scheme.find(this, 'revertButton').set("value", OSjs.Applications.ApplicationFSExtender._("REVERT_LABEL"));
    scheme.find(this, 'formatsdButton').set("value", OSjs.Applications.ApplicationFSExtender._("FORMAT_LABEL"));
    scheme.find(this, 'exitButton').set("value", OSjs.Applications.ApplicationFSExtender._("EXIT_LABEL"));


    scheme.find(this, 'pivotButton').set("disabled", true);
    scheme.find(this, 'revertButton').set("disabled", true);
    scheme.find(this, 'formatsdButton').set("disabled", true);
    scheme.find(this, 'exitButton').set("disabled", true); 
    
    verifyFdisk(self, scheme);
    
    return root;
  };

  ApplicationFSExtenderWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationFSExtender(args, metadata) {
    Application.apply(this, ['ApplicationFSExtender', args, metadata]);
  }

  ApplicationFSExtender.prototype = Object.create(Application.prototype);
  ApplicationFSExtender.constructor = Application;

  ApplicationFSExtender.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationFSExtender.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationFSExtenderWindow(self, metadata, scheme));
      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFSExtender = OSjs.Applications.ApplicationFSExtender || {};
  OSjs.Applications.ApplicationFSExtender.Class = ApplicationFSExtender;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
