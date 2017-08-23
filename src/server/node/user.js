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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
const Settings = require('./settings.js');

/**
 * Contains information about a user
 *
 * @desc This is normally passed around in modules
 */
class User {

  /**
   * Constructor
   * @param {String} uid User ID
   * @param {String} username Username
   * @param {String} name User name
   * @param {String[]} [groups] Groups (will default to configuration)
   */
  constructor(uid, username, name, groups) {
    /**
     * User ID
     * @type String
     */
    this.id = uid;

    /**
     * Username
     * @type String
     */
    this.username = username;

    /**
     * User name
     * @type String
     */
    this.name = name;

    /**
     * Virtual user (if you set this, you can use the special $ vfs root)
     * @type Boolean
     */
    this.virtual = false;

    if ( !(groups instanceof Array) || !groups.length ) {
      groups = Settings.get('api.defaultGroups') || [];
    }

    /**
     * Groups
     * @type String[]
     */
    this.groups = groups;
  }

  /**
   * Creates an object that can be used as JSON
   * @return {Object}
   */
  toJson() {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      groups: this.groups
    };
  }

  /**
   * Checks if user has given group(s)
   *
   * @param   {String|Array}     groupList     Group(s)
   * @param   {Boolean}          [all=true]    Check if all and not some
   *
   * @return {Boolean}
   */
  hasGroup(groupList, all) {
    if ( !(groupList instanceof Array) ) {
      groupList = [groupList];
    }

    if ( !groupList.length ) {
      return true;
    }

    if ( this.groups.indexOf('admin') !== -1 ) {
      return true;
    }

    if ( !(groupList instanceof Array) ) {
      groupList = [groupList];
    }

    const m = (typeof all === 'undefined' || all) ? 'every' : 'some';
    return groupList[m]((name) => {
      if ( this.groups.indexOf(name) !== -1 ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Creates a new User object from a generic object
   * @param {Object} obj Object
   * @return {User}
   */
  static createFromObject(obj) {
    if ( !obj ) {
      console.debug('We got no user from HTTP request...');
      return new User(0, 'null', 'null', []);
    }
    return new User(obj.id, obj.username, obj.name, obj.groups);
  }

}

module.exports = User;
