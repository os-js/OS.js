/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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

(function(Utils, VFS, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  function filter(from, index, shrt, toindex) {
    var list = [];
    for ( var i = (shrt ? 0 : toindex); i < from.length; i++ ) {
      list.push(from[i]);
    }
    return list;
  }

  function format(fmt, date) {
    var utc;

    if ( typeof fmt === 'undefined' || !fmt ) {
      fmt = ExtendedDate.config.defaultFormat;
    } else {
      if ( typeof fmt !== 'string' ) {
        utc = fmt.utc;
        fmt = fmt.format;
      } else {
        utc = ExtendedDate.config.utc;
      }
    }

    if ( date instanceof ExtendedDate ) {
      date = date.date;
    }
    return dateFormat(date, fmt, utc);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXTENDED DATE FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Extended Date Helper
   *
   * Works just like 'Date', but has some extended methods
   *
   * @api OSjs.Helpers.Date
   * @extends Date
   * @see Date
   * @class
   */
  function ExtendedDate(date) {
    if ( date ) {
      if ( date instanceof Date ) {
        this.date = date;
        return;
      } else if ( date instanceof ExtendedDate ) {
        this.date = date.date;
        return;
      } else if ( typeof date === 'string' ) {
        this.date = new Date(date);
        return;
      }
    }
    this.date = new Date();
    /*
    function construct(constructor, args) {
      function F() {
        return constructor.apply(this, args);
      }
      F.prototype = constructor.prototype;
      return new F();
    }

    this.date = construct(Date, arguments);
    */
  }

  //
  // Global Configuration
  //
  ExtendedDate.config = {
    defaultFormat: 'isoDateTime'
    //utc: true
  };

  //
  // Date Methods
  //

  var methods = [
    'UTC',
    'now',
    'parse',
    'getDate',
    'getDay',
    'getFullYear',
    'getHours',
    'getMilliseconds',
    'getMinutes',
    'getMonth',
    'getSeconds',
    'getTime',
    'getTimezoneOffset',
    'getUTCDate',
    'getUTCDay',
    'getUTCFullYear',
    'getUTCHours',
    'getUTCMilliseconds',
    'getUTCMinutes',
    'getUTCMonth',
    'getUTCSeconds',
    'getYear',
    'setDate',
    'setFullYear',
    'setHours',
    'setMilliseconds',
    'setMinutes',
    'setMonth',
    'setSeconds',
    'setTime',
    'setUTCDate',
    'setUTCFullYear',
    'setUTCHours',
    'setUTCMilliseconds',
    'setUTCMinutes',
    'setUTCMonth',
    'setUTCSeconds',
    'setYear',
    'toDateString',
    'toGMTString',
    'toISOString',
    'toJSON',
    'toLocaleDateString',
    'toLocaleFormat',
    'toLocaleString',
    'toLocaleTimeString',
    'toSource',
    'toString',
    'toTimeString',
    'toUTCString',
    'valueOf'
  ];

  methods.forEach(function(m) {
    ExtendedDate.prototype[m] = function() {
      return this.date[m].apply(this.date, arguments);
    };
  });

  //
  // Extended Methods
  //

  ExtendedDate.prototype.get = function() {
    return this.date;
  };

  ExtendedDate.prototype.format = function(fmt) {
    return ExtendedDate.format(this, fmt);
  };

  ExtendedDate.prototype.getFirstDayInMonth = function(fmt) {
    return ExtendedDate.getFirstDayInMonth(fmt, null, null, this);
  };

  ExtendedDate.prototype.getLastDayInMonth = function(fmt) {
    return ExtendedDate.getLastDayInMonth(fmt, null, null, this);
  };

  ExtendedDate.prototype.getDaysInMonth = function() {
    return ExtendedDate.getDaysInMonth(null, null, this);
  };

  ExtendedDate.prototype.getWeekNumber = function() {
    return ExtendedDate.getWeekNumber(this);
  };

  ExtendedDate.prototype.isWithinMonth = function(from, to) {
    return ExtendedDate.isWithinMonth(this, from, to);
  };

  //
  // Static Methods
  //

  ExtendedDate.format = function(date, fmt) {
    return format(fmt, date);
  };

  ExtendedDate.getPreviousMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;

    if (now.getMonth() === 0) {
      current = new Date(now.getFullYear() - 1, 11, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return new ExtendedDate(current);
  };

  ExtendedDate.getNextMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;

    if (now.getMonth() === 11) {
      current = new Date(now.getFullYear() + 1, 0, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    return new ExtendedDate(current);
  };

  ExtendedDate.getFirstDayInMonth = function(fmt, y, m, now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    y = (typeof y === 'undefined' || y === null || y < 0 ) ? now.getFullYear() : y;
    m = (typeof m === 'undefined' || m === null || m < 0 ) ? now.getMonth() : m;

    var date = new Date();
    date.setFullYear(y, m, 1);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };

  ExtendedDate.getLastDayInMonth = function(fmt, y, m, now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    y = (typeof y === 'undefined' || y === null || y < 0 ) ? now.getFullYear() : y;
    m = (typeof m === 'undefined' || m === null || m < 0 ) ? now.getMonth() : m;

    var date = new Date();
    date.setFullYear(y, m, 0);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };


  ExtendedDate.getDaysInMonth = function(y, m, now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    y = (typeof y === 'undefined' || y === null || y < 0 ) ? now.getFullYear() : y;
    m = (typeof m === 'undefined' || m === null || m < 0 ) ? now.getMonth() : m;

    var date = new Date();
    date.setFullYear(y, m, 0);
    return parseInt(date.getDate(), 10);
  };

  ExtendedDate.getWeekNumber = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();

    var d = new Date(+now);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
  };

  ExtendedDate.getDayName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(dateFormat.i18n.dayNames, index, shrt, 7);
    }

    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 7);
    return dateFormat.dayNames[idx];
  };

  ExtendedDate.getMonthName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(dateFormat.i18n.monthNames, index, shrt, 12);
    }

    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 12);
    return dateFormat.monthNames[idx];
  };

  ExtendedDate.isWithinMonth = function(now, from, to) {
    if ( now.getFullYear() >= from.getFullYear() && now.getMonth() >= from.getMonth() ) {
      if ( now.getFullYear() <= to.getFullYear() && now.getMonth() <= to.getMonth() ) {
        return true;
      }
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // DATE FORMATTING
  /////////////////////////////////////////////////////////////////////////////

  /*
   * Date Format 1.2.3
   * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
   * MIT license
   *
   * Includes enhancements by Scott Trenda <scott.trenda.net>
   * and Kris Kowal <cixar.com/~kris.kowal/>
   */
  var dateFormat = (function() {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g;

    function pad(val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) {
        val = '0' + val;
      }
      return val;
    }

    return function (date, mask, utc) {
      var dF = dateFormat;

      if (isNaN(date)) {
        throw new SyntaxError('invalid date');
      }

      mask = String(dF.masks[mask] || mask || dF.masks['default']);
      if (mask.slice(0, 4) === 'UTC:') {
        mask = mask.slice(4);
        utc = true;
      }

      var _ = utc ? 'getUTC' : 'get',
        d = date[_ + 'Date'](),
        D = date[_ + 'Day'](),
        m = date[_ + 'Month'](),
        y = date[_ + 'FullYear'](),
        H = date[_ + 'Hours'](),
        M = date[_ + 'Minutes'](),
        s = date[_ + 'Seconds'](),
        L = date[_ + 'Milliseconds'](),
        o = utc ? 0 : date.getTimezoneOffset(),
        flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dF.i18n.dayNames[D],
          dddd: dF.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dF.i18n.monthNames[m],
          mmmm: dF.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(L > 99 ? Math.round(L / 10) : L),
          t:    H < 12 ? 'a'  : 'p',
          tt:   H < 12 ? 'am' : 'pm',
          T:    H < 12 ? 'A'  : 'P',
          TT:   H < 12 ? 'AM' : 'PM',
          Z:    utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
          o:    (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
        };

      return mask.replace(token, function ($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
      });
    };
  })();

  dateFormat.masks = {
    'default':      'ddd mmm dd yyyy HH:MM:ss',
    shortDate:      'm/d/yy',
    mediumDate:     'mmm d, yyyy',
    longDate:       'mmmm d, yyyy',
    fullDate:       'dddd, mmmm d, yyyy',
    shortTime:      'h:MM TT',
    mediumTime:     'h:MM:ss TT',
    longTime:       'h:MM:ss TT Z',
    isoDate:        'yyyy-mm-dd',
    isoTime:        'HH:MM:ss',
    isoDateTime:    'yyyy-mm-dd\'T\'HH:MM:ss',
    isoUtcDateTime: 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\''
  };

  dateFormat.i18n = {
    dayNames: [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ],
    monthNames: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.Date = ExtendedDate;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

