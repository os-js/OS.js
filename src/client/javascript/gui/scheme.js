/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
//import Promise from 'bluebird';
import axios from 'axios';

//import * as FS from 'utils/fs';
import * as DOM from 'utils/dom';
import * as Utils from 'utils/misc';
import GUIElement from 'gui/element';
import {getConfig, getBrowserPath} from 'core/config';

/////////////////////////////////////////////////////////////////////////////
// INTERNAL HELPERS
/////////////////////////////////////////////////////////////////////////////

/*
 * Method for adding children (moving)
 */
function addChildren(frag, root, before) {
  if ( frag ) {
    const children = frag.children;

    let i = 0;
    while ( children.length && i < 10000 ) {
      if ( before ) {
        root.parentNode.insertBefore(children[0], root);
      } else {
        root.appendChild(children[0]);
      }
      i++;
    }
  }
}

/*
 * Makes sure "include" fragments are rendered correctly
 */
function resolveFragments(scheme, node) {
  function _resolve() {
    const nodes = node.querySelectorAll('gui-fragment');
    if ( nodes.length ) {
      nodes.forEach(function(el) {
        const id = el.getAttribute('data-fragment-id');
        if ( id ) {
          const frag = scheme.getFragment(id, 'application-fragment');
          if ( frag ) {
            addChildren(frag.cloneNode(true), el.parentNode);
          } else {
            console.warn('Fragment', id, 'not found');
          }
        }
        DOM.$remove(el); // Or else we'll never get out of the loop!
      });
      return true;
    }
    return false;
  }

  if ( scheme ) {
    let resolving = true;
    while ( resolving ) {
      resolving = _resolve();
    }
  }
}

/*
 * Removes self-closing tags from HTML string
 */
function removeSelfClosingTags(str) {
  const split = (str || '').split('/>');

  let newhtml = '';
  for (let i = 0; i < split.length - 1;i++) {
    const edsplit = split[i].split('<');
    newhtml += split[i] + '></' + edsplit[edsplit.length - 1].split(' ')[0] + '>';
  }
  return newhtml + split[split.length - 1];
}

/*
 * Cleans a HTML string
 */
function cleanScheme(html) {
  return Utils.cleanHTML(removeSelfClosingTags(html));
}

/* FIXME: This is no longer used because of Webpack, but I might
 * need this for the IDE ?!
 *
 * Makes sure "external include" fragments are rendered correctly.
 *
 * Currently this only supports one level deep.
 *
 * This occurs on the load() function instead on runtime due to
 * performance concerns.
function resolveExternalFragments(root, html, cb) {
  let doc = document.createElement('div');
  doc.innerHTML = html;

  let nodes = doc.querySelectorAll('gui-fragment[data-fragment-external]');

  Promise.each(nodes.map(function(el) {
    return {
      element: el,
      uri: el.getAttribute('data-fragment-external')
    };
  }), (iter) => {
    return new Promise((next) => {
      const uri = iter.uri.replace(/^\//, '');
      if ( uri.length < 3 ) {
        console.warn('resolveExternalFragments()', 'invalid', iter);
        next();
        return;
      }

      axios({
        url: FS.pathJoin(root, uri),
        method: 'GET'
      }).then((response) => {
        let tmp = document.createElement('div');
        tmp.innerHTML = cleanScheme(response.data);
        addChildren(tmp, iter.element, iter.element);
        tmp = next();
      }).catch((err) => {
        next();
      });
    });

  }).then(() => {
    cb(doc.innerHTML);

    doc = null;
    nodes = null;

    return true;
  });
}
 */

/////////////////////////////////////////////////////////////////////////////
// SCHEME
/////////////////////////////////////////////////////////////////////////////

/**
 * The class for loading and parsing UI Schemes
 *
 * @desc Class for loading, parsing and manipulating Scheme files.
 */
export default class GUIScheme {

  /**
   * @param {String}    url     Scheme URL
   */
  constructor(url) {
    console.debug('GUIScheme::construct()', url);

    /**
     * The URL of the Scheme file
     * @type {String}
     */
    this.url = url;

    /**
     * The Scheme DOM Node
     * @type {DocumentFragment}
     */
    this.scheme = null;

    this.triggers = {render: []};
  }

  /**
   * Destroys the instance
   */
  destroy() {
    DOM.$empty(this.scheme);

    this.scheme = null;
    this.triggers = {};
  }

  /**
   * Register event
   *
   * @param   {String}      f       Event name
   * @param   {Function}    fn      Function/callback
   */
  on(f, fn) {
    this.triggers[f].push(fn);
  }

  /*
   * Trigger event
   */
  _trigger(f, args) {
    args = args || [];

    if ( this.triggers[f] ) {
      this.triggers[f].forEach((fn) => {
        fn.apply(this, args);
      });
    }
  }

  /*
   * Content loading wrapper
   */
  _load(html, src) {
    let doc = document.createDocumentFragment();
    let wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    doc.appendChild(wrapper);

    this.scheme = doc.cloneNode(true);

    if ( getConfig('DebugScheme') ) {
      console.group('Scheme::_load() validation', src);
      this.scheme.querySelectorAll('*').forEach((node) => {
        const tagName = node.tagName.toLowerCase();
        const gelData = GUIElement.getRegisteredElement(tagName);
        if ( gelData ) {
          const ac = gelData.metadata.allowedChildren;
          if ( ac instanceof Array && ac.length ) {
            const childrenTagNames = node.children.map((sNode) => {
              return sNode.tagName.toLowerCase();
            });

            childrenTagNames.forEach((chk, idx) => {
              const found = ac.indexOf(chk);
              if ( found === -1 ) {
                console.warn(chk, node.children[idx], 'is not a valid child of type', tagName);
              }
            });
          }

          const ap = gelData.metadata.allowedParents;
          if ( ap instanceof Array && ap.length ) {
            const parentTagName = node.parentNode.tagName.toLowerCase();
            if ( ap.indexOf(parentTagName) === -1 ) {
              console.warn(parentTagName, node.parentNode, 'is in an invalid parent of type', tagName);
            }
          }
        }
      });
      console.groupEnd();
    }

    wrapper = null;
    doc = null;
  }

  /**
   * Load Scheme from URL
   *
   * @param   {Function}    cb      callback => fn(error, DocumentFragment)
   * @param   {Function}    [cbxhr] callback on ajax => fn(error, html)
   */
  load(cb, cbxhr) {
    cbxhr = cbxhr || function() {};

    console.debug('GUIScheme::load()', this.url);

    let src = this.url;
    if ( src.substr(0, 1) !== '/' && !src.match(/^(https?|ftp)/) ) {
      src = getBrowserPath(src);
    }

    //const root = FS.dirname(src);

    axios({
      url: src,
      method: 'GET'
    }).then((response) => {
      const html = cleanScheme(response.data);
      /*
      resolveExternalFragments(root, html, (result) => {
      });
      */
      // This is normally used for the preloader for caching
      cbxhr(false, html);

      // Then we run some manipulations
      this._load(html, src);

      // And finally, finish
      cb(false, this.scheme);
    }).catch((err) => {
      cb('Failed to fetch scheme: ' + err.message);
      cbxhr(true);
    });
  }

  /**
   * Get fragment from ID (and/or type)
   *
   * @param   {String}      id      ID
   * @param   {String}      [type]  Type (application-window | application-fragment)
   *
   * @return  {Node}
   */
  getFragment(id, type) {
    let content = null;
    if ( id ) {
      if ( type ) {
        content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
      } else {
        content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-dialog[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
      }
    }
    return content;
  }

  /**
   * Parses the given fragment
   *
   * @param   {String}            id        Fragment ID
   * @param   {String}            [type]    Fragment Type
   * @param   {Window}            [win]     OS.js Window
   * @param   {Function}          [onparse] Callback on parsed
   * @param   {Object}            [args]    Parameters
   *
   * @return  {Node}
   */
  parse(id, type, win, onparse, args) {
    const content = this.getFragment(id, type);

    console.debug('GUIScheme::parse()', id);

    if ( !content ) {
      console.error('GUIScheme::parse()', 'No fragment found', id + '@' + type);
      return null;
    }

    type = type || content.tagName.toLowerCase();
    args = args || {};

    if ( content ) {
      const node = content.cloneNode(true);

      // Resolve fragment includes before dynamic rendering
      if ( args.resolve !== false ) {
        resolveFragments(this, node);
      }

      GUIElement.parseNode(win, node, type, args, onparse, id);

      return node;
    }

    return null;
  }

  /**
   * Renders the given fragment into Window
   *
   * @param   {Window}    win       OS.js Window
   * @param   {String}    id        Fragment ID
   * @param   {Node}      [root]    Root HTML Node
   * @param   {String}    [type]    Fragment Type
   * @param   {Function}  [onparse] Callback on parsed
   * @param   {Object}    [args]    Parameters
   */
  render(win, id, root, type, onparse, args) {
    root = root || win._getRoot();
    if ( root instanceof GUIElement ) {
      root = root.$element;
    }

    function setWindowProperties(frag) {
      if ( frag ) {
        const width = parseInt(frag.getAttribute('data-width'), 10) || 0;
        const height = parseInt(frag.getAttribute('data-height'), 10) || 0;
        const allow_maximize = frag.getAttribute('data-allow_maximize');
        const allow_minimize = frag.getAttribute('data-allow_minimize');
        const allow_close = frag.getAttribute('data-allow_close');
        const allow_resize = frag.getAttribute('data-allow_resize');

        if ( (!isNaN(width) && width > 0) || (!isNaN(height) && height > 0) ) {
          win._resize(width, height);
        }

        win._setProperty('allow_maximize', allow_maximize);
        win._setProperty('allow_minimize', allow_minimize);
        win._setProperty('allow_close', allow_close);
        win._setProperty('allow_resize', allow_resize);
      }
    }

    console.debug('GUIScheme::render()', id);

    const content = this.parse(id, type, win, onparse, args);
    addChildren(content, root);

    root.querySelectorAll('application-fragment').forEach((e) => {
      DOM.$remove(e);
    });

    if ( !win._restored ) {
      setWindowProperties(this.getFragment(id));
    }

    this._trigger('render', [root]);
  }

  /**
   * Get HTML from Scheme
   *
   * @return  {String}
   */
  getHTML() {
    return this.scheme.firstChild.innerHTML;
  }

  /**
   * Creates a new Scheme from a string
   * @param {String} str The string (HTML)
   * @return GUIScheme
   */
  static fromString(str) {
    const inst = new GUIScheme(null);
    const cleaned = cleanScheme(str);
    inst._load(cleaned, '<html>');
    return inst;
  }

}

