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

const ws = require('ws');
const colors = require('colors');

const Settings = require('./../../settings.js');
const Modules = require('./../../modules.js');
const HttpConnection = require('./http.js');

/*
 * Parses a query
 */
const getParsedQuery = (query, regexp, route) => {
  if ( typeof route !== 'string' ) {
    route = '';
  }

  const values = query.split(regexp).filter((str) => !!str);
  const keys = (route.match(/\:([A-z0-9_]+)/g) || []).map((str) => {
    return str.substr(1);
  });

  if ( keys.length === values.length ) {
    const result = {};
    keys.forEach((k, i) => (result[k] = values[i]));
    return result;
  }

  return values;
};

class WSConnection extends HttpConnection {

  constructor() {
    super(...arguments);
    this.websocketMap = {};
  }

  /**
   * Destroys the module
   * @return {Promise<Boolean, Error>}
   */
  destroy() {
    this.websocketMap = {};

    if ( this.websocket ) {
      this.websocket.close();
    }

    return super.destroy(...arguments);
  }

  /**
   * Registers the module
   * @return {Promise<Boolean, Error>}
   */
  register() {
    return new Promise((resolve, reject) => {
      super.register(...arguments).then(() => {
        const hostname = Settings.option('HOSTNAME') || Settings.get('http.hostname');
        const wsSettings = Settings.get('http.ws');
        const wsOptions = {
          server: this.server,
          path: wsSettings.path
        };

        if ( wsSettings.port !== 'upgrade' ) {
          wsOptions.port = wsSettings.port;
        }

        console.log(colors.bold('Creating'), colors.green('websocket'), 'server on', hostname + '@' + wsSettings.port + wsSettings.path);

        this.websocket = new ws.Server(wsOptions);
        this.websocket.on('connection', (ws, upgradeReq) => {
          const sid = this.getSessionId(upgradeReq);

          ws.on('message', (msg) => {
            try {
              msg = JSON.parse(msg);
              this.handleMessage(ws, msg, upgradeReq);
            } catch ( e ) {
              console.error(e);
            }
          });

          ws.on('close', () => {
            if ( typeof this.websocketMap[sid] !== 'undefined' ) {
              delete this.websocketMap[sid];
            }
            console.info('< Closed a Websocket connection...');
          });

          this.websocketMap[sid] = ws;

          console.info('> Created a Websocket connection...');
        });

        return resolve(true);
      }).catch(reject);
    });
  }

  getWebsocketFromUser(username) {
    let foundSid = null;

    Object.keys(this.sidMap).forEach((sid) => {
      if ( foundSid === null && this.sidMap[sid] === username ) {
        foundSid = sid;
      }
    });

    if ( this.websocketMap[foundSid] ) {
      console.warn('FOUND YOUR USER WEBSOCKET', foundSid);
      return this.websocketMap[foundSid];
    }

    return null;
  }

  /**
   * Broadcast a message
   * @param {String} username User
   * @param {String} action Action
   * @param {*} message Message
   */
  broadcast(username, action, message) {
    const data = JSON.stringify({
      action: action,
      args: message
    });

    if ( username ) {
      const ws = this.getWebsocketFromUser(username);
      ws.send(data);
    } else {
      this.websocket.clients.forEach((client) => client.send(data));
    }
  }

  /**
   * Handles the incoming WebSocket message
   * @param {Websocket} ws Client socket
   * @param {Object} msg Message
   * @param {IncomingMessage} req Http Request
   */
  handleMessage(ws, msg, req) {
    const query = msg.path;
    const args = msg.args || {};
    const index = msg._index;

    const found = this.app._router.stack.filter((iter) => {
      return iter.name === 'bound dispatch' && iter.regexp !== /^\/?(?=\/|$)/i;
    }).find((iter) => {
      return iter.match(query);
    });

    const send = (newRequest, data) => {
      if ( typeof index !== 'undefined' ) {
        data._index = index;
      }

      if ( data.error instanceof Error ) {
        console.error(data.error);
        data.error = data.error.toString();
      }

      const module = Modules.getSession() || {};
      const sid = this.getSessionId(newRequest);

      if ( module.touch ) {
        module.touch(sid, newRequest.session, (err, session) => {
          if ( session ) {
            newRequest.session = session;
          }
          if ( err ) {
            console.error(err);
          }

          ws.send(JSON.stringify(data));
        });
      } else {
        ws.send(JSON.stringify(data));
      }
    };

    const respond = (newRequest) => {
      if ( found ) {
        newRequest.params = getParsedQuery(query, found.regexp, found.route.path);

        const responder = {
          status: () => responder,
          send: (data) => send(newRequest, data),
          json: (data) => send(newRequest, data)
        };

        found.handle_request(newRequest, responder, () => {
          console.error('Not handled', query);
        });
      } else {
        console.error(404, query);
      }
    };

    this.session(req, {}, (err) => {
      respond(Object.assign(req, {
        method: 'POST',
        query: query,
        body: args
      }));
    });
  }

}

module.exports = WSConnection;
