#!/usr/bin/env python
#
# OS.js - JavaScript Operating System
#
# Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met: 
# 
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer. 
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution. 
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# @author  Anders Evenrud <andersevenrud@gmail.com>
# @licence Simplified BSD License
#

# System modules
import re
import os
import cgi
import sys
import json
import BaseHTTPServer

from SimpleHTTPServer import SimpleHTTPRequestHandler

# Local modules
import vfs
import api


#
# Helpers
#

def read_settings():
  path = os.path.dirname(os.path.abspath(__file__))
  path = os.path.join(path, 'settings.json')

  f = open(path, 'r')
  s = f.read()
  settings = json.loads(s)
  return settings

def get_request_data(server):
  ctype, pdict = cgi.parse_header(server.headers.getheader('content-type'))
  data = {}

  if ctype == 'application/json':
    length = int(server.headers.getheader('content-length'))
    #data = cgi.parse_qs(server.rfile.read(length), keep_blank_values=1)
    data = json.loads(server.rfile.read(length))

  return data

def respond_with_json(server, data):
  server.send_response(200)
  server.send_header('Content-Type', 'application/json')
  server.end_headers()
  server.wfile.write(json.dumps(data))

def respond_with_file(server, mime, path):
  server.send_response(200)
  server.send_header('Content-Type', mime)
  server.end_headers()

  f = open(path, 'r')
  s = f.read()
  server.wfile.write(s)

def get_api_request_data(server):
  data = get_request_data(server)
  meth = ''
  args = {}

  try:
    args = data['arguments']
  except KeyError, e:
    pass

  try:
    meth = data['method']
  except KeyError, e:
    pass

  return (data, meth, args)

#
# INIT
#

SETTINGS = read_settings()
DISTDIR  = 'dist-dev'

#
# SERVER
#

class ServerHandler(SimpleHTTPRequestHandler):
  def do_POST(self):

    print '<<< %s' % (self.path)

    if None != re.search('^\/FS\/*', self.path):
      print '--- FS %s' % self.path

      return

    elif None != re.search('^\/API', self.path):
      output = None

      (input, meth, args) = get_api_request_data(self)

      print '--- API %s (%s) %s' % (self.path, meth, json.dumps(input))

      try:
        output = getattr(api, 'call_' + meth)(self, self.path, args)
      except:
        output = {'error': 'An error occured while calling API method "%s"' % meth, 'result': None}

    if output is not None:
      respond_with_json(self, output)
      return

    self.send_response(403)
    self.send_header('Content-Type', 'application/json')
    self.end_headers()

  def do_GET(self):
    if None != re.search('^FS\/*', self.path):
      print '--- Get File %s' % self.path

      (mime, data) = vfs.read_file(self.path)
      respond_with_file(self, mime, data)
      return

    return SimpleHTTPRequestHandler.do_GET(self)

#
# MAIN
#

if __name__ == '__main__':
  print json.dumps(SETTINGS)

  os.chdir(DISTDIR)

  port = SETTINGS['port']
  server_address = ('0.0.0.0', port)

  httpd = BaseHTTPServer.HTTPServer(server_address, ServerHandler)

  sa = httpd.socket.getsockname()
  print "Serving HTTP on", sa[0], "port", sa[1], "..."
  httpd.serve_forever()
