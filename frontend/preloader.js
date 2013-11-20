/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {

  window.OSjs = window.OSjs || {};
  OSjs.Utils = OSjs.Utils || {};


  /**
   * Preloader -- Construct a new Preloader
   *
   * @param   Array     args:list          List of resources
   * @param   Function  args:onFinished    When done loading all resources in queue
   * @param   Function  args:onSuccess     When resource successfully loaded
   * @param   Function  args:onError       When resource fails to load
   * @param   int       args:parallel      How many resources to load at once
   *
   * @constructor
   */
  var Preloader = function(args) {
    args = args || {};

    this._list         = [];                   //!< Remaining items
    this._finished     = false;                //!< Finished state
    this._errors       = [];                   //!< Loading error count
    this._total        = 0;                    //!< Loading try count
    this._parallel     = 1;                    //!< Parallel loading count
    this._onFinished   = function() {};        //!< Callback= Finished with queue
    this._onSuccess    = function() {};        //!< Callback= Finished with resource
    this._onError      = function() {};        //!< Callback= Error with resource

    this._list        = args.list || [];
    this._total       = this._list.length;
    this._parallel    = args.parallel || 1;

    var self = this;
    this._onFinished  = function() {
      if ( self._finished ) {
        return;
      }
      self._finished = true;

      (args.onFinished || function() {})(self._total, self._errors.length, self._errors);
    };

    this._onSuccess   = function(src) {
      if ( self._finished )
        return;

      console.log("Preloader::_onSuccess()", src);

      (args.onSuccess || function() {})(src);

      self._checkQueue();
    };

    this._onError     = function(src) {
      if ( self._finished )
        return;

      self._errors.push(src);

      console.log("Preloader::_onError()", src);

      (args.onError || function() {})(src);

      self._checkQueue();
    };

    console.group("Preloader::init()");
    console.log("List", this._list, "Max parallel", this._parallel);
    console.groupEnd();

    this.run();
  };

  /**
   * Preloader::destroy() -- Destroy current instance
   * @destructor
   */
  Preloader.prototype.destroy = function() {
    console.log("Preloader::destroy()");

    this._finished    = false;
    this._list        = [];
    this._errors      = [];
    this._total       = 0;
    this._parallel    = 1;
    this._onFinished  = function() {};
    this._onSuccess   = function() {};
    this._onError     = function() {};
  };

  /**
   * Preloader::run() -- Start loading
   * @return  void
   */
  Preloader.prototype.run = function() {
    this._checkQueue();
  };

  /**
   * Preloader::_checkQueue() -- Check the Queue for items to load
   * @return  void
   */
  Preloader.prototype._checkQueue = function() {
    if ( this._list.length ) {
      for ( var i = 0; i < this._parallel; i++ ) {
        var item = this._list.shift();
        if ( item.type == "image" ) {
          this._loadImage(item.src);
        } else if ( item.type == "video" || item.type == "film") {
          this._loadVideo(item.src);
        } else if ( item.type == "sound" || item.type == "video" ) {
          this._loadAudio(item.src);
        } else if ( item.type == "css" || item.type == "stylesheet" ) {
          this._loadCSS(item.src);
        } else if ( item.type == "javascript" || item.type == "script" ) {
          this._loadJavaScript(item.src);
        }
        return;
      }
    }

    this._onFinished();
  };

  /**
   * Preloader::_cleanResource() -- Handle safe destruction of DOM objects etc.
   * @return  void
   */
  Preloader.prototype._cleanResource = function(res) {
    var self = this;
    try {
      res.removeEventListener('canplaythrough', function(ev) {
        self._onSuccess(src);
        self._cleanResource(res);
      }, false );
    } catch ( eee ) {}
  };

  /**
   * Preload::_loadImage() -- Handle loading of Images
   * @param   String    src       Absolute path to resource
   * @return  void
   */
  Preloader.prototype._loadImage = function(src) {
    var self = this;

    var res    = new Image();
    res.onload = function() {
      self._onSuccess(src);
    };
    res.onerror = function() {
      self._onError(src);
    };
    res.src = src;
  };

  /**
   * Preload::_loadVideo() -- Handle loading of Video
   * @param   String    src       Absolute path to resource
   * @return  void
   */
  Preloader.prototype._loadVideo = function(src) {
    var self = this;

    var res     = document.createElement("video");
    res.onerror = function() {
      self._onError(src);
      self._cleanResource(res);
    };

    res.addEventListener('canplaythrough', function(ev) {
      self._onSuccess(src);
      self._cleanResource(res);
    }, false );

    res.preload   = "auto";
    res.src       = src;
  };

  /**
   * Preload::_loadAudio() -- Handle loading of Audio
   * @param   String    src       Absolute path to resource
   * @return  void
   */
  Preloader.prototype._loadAudio = function(src) {
    var self = this;

    var res     = new Audio();
    res.onerror = function() {
      self._onError(src);
      self._cleanResource(res);
    };

    res.addEventListener('canplaythrough', function(ev) {
      self._onSuccess(src);
      self._cleanResource(res);
    }, false );

    res.preload   = "auto";
    res.src       = src;
  };

  /**
   * Preload::_loadCSS() -- Handle loading of CSS Stylesheet
   *
   * There currently are no onload() an onerror() event
   * for <link /> items. IE has document.createStyleSheet(), W3C only has
   * DOM.
   *
   * In IE, we assume the stylesheet is added. Otherwise we use an interval
   * to check if the 
   *
   * @param   String    src         Absolute path to resource
   * @param   int       interval    Interval (in ms)
   * @param   int       timeout     Timeout (in ms)
   * @return  void
   */
  Preloader.prototype._loadCSS = function(src, interval, timeout) {
    var self = this;

    interval  = interval  || 10;
    timeout   = timeout   || 7500;

    if ( document.createStyleSheet ) {
      document.createStyleSheet(src);
      this._onSuccess(src);
    } else {
      var res    = document.createElement("link");
      res.rel    = "stylesheet";
      res.type   = "text/css";
      res.href   = src;

      var _found   = false;
      var _poll    = null;
      var _timeout = null;
      var _clear    = function() {

        if ( _timeout ) {
          clearTimeout(_timeout);
          _timeout = null;
        }
        if ( _poll ) {
          clearInterval(_poll);
          _poll = null;
        }
      };

      _timeout = setTimeout(function() {
        if ( !_found ) {
          self._onError(src);
        }

        _clear();
      }, timeout);

      _poll  = setInterval(function() {
        if ( res ) {
          var sheet     = "styleSheet";
          var cssRules  = "rules";
          if ( "sheet" in res ) {
            sheet     = "sheet";
            cssRules  = "cssRules";
          }

          try {
            if ( res[sheet] && res[sheet][cssRules].length ) {
              _found = true;
              self._onSuccess(src);
              _clear();
            }
          } catch ( eee ) { (function() {})(); } finally { (function() {})(); }
        }
      }, interval);

      document.getElementsByTagName("head")[0].appendChild(res);
    }

  };

  /**
   * Preload::_loadJavaScript() -- Handle loading of (ECMA) JavaScript
   * @param   String    src       Absolute path to resource
   * @return  void
   */
  Preloader.prototype._loadJavaScript = function(src) {
    var self   = this;
    var loaded = false;

    var res                = document.createElement("script");
    res.type               = "text/javascript";
    res.charset            = "utf-8";
    res.onreadystatechange = function() {
      if ( (this.readyState == 'complete' || this.readyState == 'loaded') && !loaded) {
        loaded = true;
        if ( self._onSuccess ) // Needed because this event may fire after destroy() in some browsers, depending on onload
          self._onSuccess(src);
      }
    };
    res.onload             = function() {
      if ( loaded )
        return;
      loaded = true;
      if ( self._onSuccess ) // Needed because this event may fire after destroy() in some browsers, depending onreadystatechange
        self._onSuccess(src);
    };
    res.onerror            = function() {
      if ( loaded )
        return;
      loaded = true;

      if ( self._onError ) // Needed because this event may fire after destroy() in some browsers, depending on above notes
        self._onError(src);
    };
    res.src = src;

    document.getElementsByTagName("head")[0].appendChild(res);
  };

  OSjs.Utils.Preloader = Preloader;

})();
