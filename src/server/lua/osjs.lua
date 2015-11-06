#!/usr/bin/env lua

--
-- Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
-- All rights reserved.
-- 
-- Redistribution and use in source and binary forms, with or without
-- modification, are permitted provided that the following conditions are met: 
-- 
-- 1. Redistributions of source code must retain the above copyright notice, this
--    list of conditions and the following disclaimer. 
-- 2. Redistributions in binary form must reproduce the above copyright notice,
--    this list of conditions and the following disclaimer in the documentation
--    and/or other materials provided with the distribution. 
-- 
-- THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
-- ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
-- WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
-- DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
-- ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
-- (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
-- LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
-- ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
-- (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
-- SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
--
-- @author  Anders Evenrud <andersevenrud@gmail.com>
-- @licence Simplified BSD License
--

local json = require "luci.json"
local nixio = require "nixio"
local fs = require "nixio.fs"

local sys = require "luci.sys"
local init = require "luci.init"

local curl = nil
if pcall(require, "curl") then
  curl = require "curl"
end

require "base64"

-- ----------------------------------------------------------------------------
--                                    CONFIG
-- ----------------------------------------------------------------------------

local DEBUGMODE = false
local ROOTDIR = "/opt/osjs"
local DISTDIR = "/opt/osjs/dist"
local SETTINGS_FILE = "/opt/osjs/settings.json"
local MIMES_FILE = "/opt/osjs/mime.json"
local TMPDIR = "/tmp"
local SETTINGS = {}
local MIMES = {}

local _settings = fs.readfile(SETTINGS_FILE)
if _settings ~= nil then
  _settings = _settings:gsub("%%DROOT%%", ROOTDIR)
  SETTINGS = json.decode(_settings)
end
_settings = nil

local _mimes = fs.readfile(MIMES_FILE)
if _mimes ~= nil then
  _mimes = json.decode(_mimes)
  MIMES = _mimes["mapping"]
end
_mimes = nil

-- ----------------------------------------------------------------------------
--                                    HELPERS
-- ----------------------------------------------------------------------------

function get_username(request, response)
  if DEBUGMODE then
    return "root"
  end

  if request.cookies["osjsuser"] then
    return request.cookies["osjsuser"]
  end
  return nil
end

function get_user_home(request, response, username)
  if username == nil then
    username = get_username(request, response)
  end

  if username == "root" then
    return "/root"
  end

  return SETTINGS["vfs"]["homes"] .. "/" .. username
end

function get_user_settings_path(request, response, username)
  local homepath = get_user_home(request, response, username)
  local configpath = homepath .. "/.osjs/settings.json"
  return configpath
end

function get_file_mime(path)
  if MIMES ~= nil then
    local filename = fs.basename(path)
    local filext = string.match(filename, "^.+(%..+)$")

    if filext ~= nil then
      if type(MIMES[filext]) ~= nil then
        return MIMES[filext]
      end
    end
  end

  return "application/octet-stream"
end

function get_real_path(request, response, path)
  local pmatch = string.match(path, "^((%a+)://)")
  local protocol = nil
  local realpath = nil
  local username = get_username(request, response)

  if pmatch ~= nil then
    path = string.gsub(path, "^((%a+)://)", "")
    protocol = string.gsub(pmatch, "://", "")
  end

  if protocol ~= nil then
    if protocol == "home" then
      realpath = get_user_home(request, response) .. path
    elseif protocol == "osjs" then
      realpath = DISTDIR .. path
    else
      if type(SETTINGS["vfs"]["mounts"][protocol]) ~= nil then
        realpath = SETTINGS["vfs"]["mounts"][protocol] .. path
      end
    end
  end

  return realpath
end

function sys_login(username, password)
  local function getpasswd(username)
    local pwe = nixio.getsp and nixio.getsp(username) or nixio.getpw(username)
    local pwh = pwe and (pwe.pwdp or pwe.passwd)
    if not pwh or #pwh < 1 or pwh == "!" or pwh == "x" then
      return nil, pwe
    else
      return pwh, pwe
    end
  end


  local pwh, pwe = getpasswd(username)
  if pwe then
    return (pwh == nil or nixio.crypt(password, pwh) == pwh)
  end
  return false
end

-- ----------------------------------------------------------------------------
--                                      VFS
-- ----------------------------------------------------------------------------

function fs_read(request, response, path)
  -- DEPRECATED
  return "Not implemented", false
end

function fs_write(request, response, path, data)
  local rpath = get_real_path(request, response, path)
  local raw = nil

  if string.match(data, "^data:(.*);base64,") ~= nil then
    raw = from_base64(string.gsub(data, "^data:(.*);base64,", ""))
  else
    raw = data
  end

  if fs.writefile(rpath, raw) then
    return false, true
  end
  return "Failed to write file", false
end

function fs_rename(request, response, src, dst)
  local rsrc = get_real_path(request, response, src)
  local rdst = get_real_path(request, response, dst)
  if fs.move(rsrc, rdst) then
    return false, true
  end
  return "Failed to rename file", false
end

function fs_copy(request, response, src, dst)
  local rsrc = get_real_path(request, response, src)
  local rdst = get_real_path(request, response, dst)
  if fs.copy(rsrc, rdst) then
    return false, true
  end
  return "Failed to copy file", false
end

function fs_remove(request, response, path)
  local rpath = get_real_path(request, response, path)
  if fs.remove(rpath) then
    return false, true
  end
  return "Failed to remove path", false
end

function fs_mkdir(request, response, path)
  local rpath = get_real_path(request, response, path)
  if fs.mkdir(rpath) then
    return false, true
  end
  return "Failed to create directory", false
end

function fs_scandir(request, response, path)
  local error = false
  local data = {}

  local realpath = get_real_path(request, response, path)
  local tmppath = string.gsub(path, "^((%a+)://)", "")
  tmppath = string.gsub(tmppath, "^\/+", "")

  if tmppath ~= "" then
    table.insert(data, {
      path = string.gsub(path, "\/%a+$", "") .. "/",
      filename = "..",
      size = 0,
      type = "dir",
      mime = "",
      ctime = nil,
      mtime = nil
    })
  end

  if realpath then
    for iter in fs.dir(realpath) do
      local filename = fs.basename(iter)
      local stat = fs.stat(realpath .. "/" .. iter)
      local filetype = "file"
      local filesize = 0
      local ctime = nil
      local mtime = nil
      local filemime = ""

      if stat ~= nil then
        if stat.type == "dir" then
          filetype = "dir"
        else
          filetype = "file"
          filesize = stat.size
          ctime = stat.ctime or nil
          mtime = stat.mtime or nil
          filemime = get_file_mime(iter)
        end
      end

      table.insert(data, {
        path = path:gsub("\/$", "") .. "/" .. filename,
        filename = filename,
        size = filesize,
        type = filetype,
        ctime = ctime,
        mtime = mtime,
        mime = filemime
      })
    end
  else
    error = "Invalid path"
  end

  return error, data
end

function fs_request(request, response, name, args)
  local error = false
  local data = false

  if name == "read" then
    error, data = fs_read(request, response, args[1])
  elseif name == "write" then
    error, data = fs_write(request, response, args[1], args[2])
  elseif name == "scandir" then
    error, data = fs_scandir(request, response, args[1])
  elseif name == "rename" then
    error, data = fs_rename(request, response, args[1], args[2])
  elseif name == "move" then
    error, data = fs_rename(request, response, args[1], args[2])
  elseif name == "copy" then
    error, data = fs_copy(request, response, args[1], args[2])
  elseif name == "remove" then
    error, data = fs_remove(request, response, args[1])
  elseif name == "mkdir" then
    error, data = fs_mkdir(request, response, args[1])
  else
    error = "Invalid VFS method"
  end

  return error, data
end

-- ----------------------------------------------------------------------------
--                                     API
-- ----------------------------------------------------------------------------

function app_request(request, response, args)
  local pkg = nil
  local app = nil

  if args["path"] then
    pkg = string.lower(string.gsub(args["path"], "^(.*)/", ""))
  else
    pkg = string.lower(args["application"])
  end

  if pkg ~= nil and pcall(require, "osjs.app."..pkg) then
    app = require ("osjs.app."..pkg)
  end

  if app then
    local method = args["method"] or nil
    local arguments = args["arguments"] or {}
    return app.request(method, arguments, request, response)
  end

  return "No such application or missing API", false
end

function curl_request(request, response, args)
  if curl == nil then
    return "cURL module not installed or enabled", false
  end

  local response = {}
  local url = args["url"] or nil
  local method = args["method"] or "GET"
  local query = args["query"] or nil
  local timeout = args["timeout"] or 0
  local binary = args["binary"] or false
  local mime = args["mime"] or nil

  local function WriteMemoryCallback(s)
    response[#response+1] = s
    return string.len(s)
  end

  if method == "POST" then
    curl.easy()
      :setopt_url(url)
      :setopt_writefunction(WriteMemoryCallback)
      :setopt_httppost(query)
      :perform()
    :close()
  else
    curl.easy()
      :setopt_url(url)
      :setopt_writefunction(WriteMemoryCallback)
      :perform()
    :close()
  end

  if binary then
    mime = mime or "application/octet-stream"
    return false, "data:" .. mime .. ";base64," .. to_base64(table.concat(response, ""))
  end

  return false, table.concat(response, "")
end

function login_request(request, response, username, password)
  if not DEBUGMODE then
    if sys_login(username, password) == false then
      return "Invalid Login", false
    end
  end

  response:set_cookie("osjsuser", {
    value = username,
    httponly = true
  })

  local userdata = {
    id = nixio.getuid(username),
    name = username,
    username = username,
    groups = {"admin", "demo"}
  }

  local usersettings = {}
  local configpath = get_user_settings_path(request, response, username)
  local _settings = fs.readfile(configpath)
  if _settings ~= nil then
    usersettings = json.decode(_settings)
  end

  return false, {
    userData = userdata,
    userSettings = usersettings
  }
end

function logout_request(request, response)
  response:delete_cookie("osjsuser")
  return false, true
end

function settings_update_request(request, response, settings)
  local data = json.encode(settings)
  local configpath = get_user_settings_path(request, response)

  if not fs.stat(configpath) then
    fs.mkdir(fs.dirname(configpath))
  end

  if fs.writefile(configpath, data) then
    return false, true
  end

  return "Failed to write settings", false
end

function api_request(request, response, meth, iargs)
  local error = false
  local data = false

  if meth == "login" then
    error, data = login_request(request, response, iargs["username"], iargs["password"])
  elseif meth == "logout" then
    error, data = logout_request(request, response)
  elseif meth == "settings" then
    error, data = settings_update_request(request, response, iargs["settings"])
  elseif meth == "curl" then
    error, data = curl_request(request, response, iargs)
  elseif meth == "application" then
    error, data = app_request(request, response, iargs)
  elseif meth == "fs" then
    error, data = fs_request(request, response, iargs["method"], iargs["arguments"])
  else
    error = "Invalid API method"
  end

  return error, data
end

-- ----------------------------------------------------------------------------
--                                   EXPORTS
-- ----------------------------------------------------------------------------

return {
  DEBUGMODE = DEBUGMODE,
  ROOTDIR = ROOTDIR,
  DISTDIR = DISTDIR,
  SETTINGS = SETTINGS,
  MIMES = MIMES,

  api_request = api_request,
  get_session = get_session,
  get_real_path = get_real_path,
  get_file_mime = get_file_mime,
  get_username = get_username,
  get_user_home = get_user_home,
  get_user_settings_path = get_user_settings_path
}

