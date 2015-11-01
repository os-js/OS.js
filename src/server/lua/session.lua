#!/usr/bin/env lua

--[[

Session authentication
(c) 2008 Steven Barth <steven@midlink.org>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

$Id$

]]--

local fs = require "nixio.fs"
local sessionpath = "/tmp"

function prepare()
  fs.mkdir(sessionpath, 700)
  if not sane() then
    error("Security Exception: Session path is not sane!")
  end
end

local function _read(id)
  local blob = fs.readfile(sessionpath .. "/" .. id)
  return blob
end

local function _write(id, data)
  local f = nixio.open(sessionpath .. "/" .. id, "w", 600)
  f:writeall(data)
  f:close()
end

local function _checkid(id)
  return not not (id and #id == 32 and id:match("^[a-fA-F0-9]+$"))
end

function write(id, data)
  if not sane() then
    prepare()
  end

  assert(_checkid(id), "Security Exception: Session ID is invalid!")
  assert(type(data) == "table", "Security Exception: Session data invalid!")

  data.atime = luci.sys.uptime()

  _write(id, luci.util.get_bytecode(data))
end

function read(id)
  if not id or #id == 0 then
    return nil
  end

  assert(_checkid(id), "Security Exception: Session ID is invalid!")

  if not sane(sessionpath .. "/" .. id) then
    return nil
  end

  local blob = _read(id)
  local func = loadstring(blob)
  setfenv(func, {})

  local sess = func()
  assert(type(sess) == "table", "Session data invalid!")

  if sess.atime and sess.atime + sessiontime < luci.sys.uptime() then
    kill(id)
    return nil
  end

  -- refresh atime in session
  write(id, sess)

  return sess
end

function sane(file)
  return luci.sys.process.info("uid")
  == fs.stat(file or sessionpath, "uid")
  and fs.stat(file or sessionpath, "modestr")
  == (file and "rw-------" or "rwx------")
end

function kill(id)
  assert(_checkid(id), "Security Exception: Session ID is invalid!")
  fs.unlink(sessionpath .. "/" .. id)
end

function reap()
  if sane() then
    local id
    for id in nixio.fs.dir(sessionpath) do
      if _checkid(id) then
        -- reading the session will kill it if it is expired
        read(id)
      end
    end
  end
end

