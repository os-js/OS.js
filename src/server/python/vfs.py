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

import re
import os
import glob
from mimetypes import MimeTypes

def call_scandir(path):
  print 'call_scandir() %s' % path
  list = []
  srcpath = os.getcwd()
  mime = MimeTypes()

  for f in os.listdir(srcpath):

    filename = os.path.basename(f)
    truepath = os.path.join(srcpath, f)

    try:
      st = os.stat(truepath)
    except:
      st = None

    filesize = 0
    filetype = 'dir'
    filemime = None
    fctime   = None
    fmtime   = None

    if os.path.isfile(truepath):
      filetype = 'file'

      try:
        filemime = mime.guess_type(truepath)[0]
      except:
        filemime = 'application/octet-stream'

      if st is not None:
        filesize = st.st_size
        fctime   = st.st_ctime
        fmtime   = st.st_mtime

    list.append({
      'filename': filename,
      'path': os.path.join(path, filename),
      'size': filesize,
      'type': filetype,
      'mime': filemime,
      'ctime': fctime,
      'mtime': fmtime
    })

  return {'error': None, 'result': list}

def call_writefile(path, data):
  # TODO
  return {'error': None, 'result': None}

def call_delete(path):
  # TODO
  return {'error': None, 'result': None}

def call_move(src, dst):
  # TODO
  return {'error': None, 'result': None}

def call_copy(src, dst):
  # TODO
  return {'error': None, 'result': None}

def call_mkdir(path):
  # TODO
  return {'error': None, 'result': None}

def call_exists(path):
  # TODO
  return {'error': None, 'result': None}

def call_fileinfo(path):
  # TODO
  return {'error': None, 'result': None}

def call_rename(src, dst):
  return call_move(src, dst)

def call_readfile(path):
  # TODO
  return {'error': None, 'result': None}

