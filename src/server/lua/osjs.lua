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
--local init = require "luci.init"

local curl = nil
if pcall(require, "curl") then
  curl = require "curl"
end

require "base64"

-- ----------------------------------------------------------------------------
--                                    CONFIG
-- ----------------------------------------------------------------------------

local ROOTDIR = "/osjs"
local SETTINGS_FILE = ROOTDIR.."/settings.json"
local SETTINGS = {}
local MIMES = {}

local _settings = fs.readfile(SETTINGS_FILE)
if _settings ~= nil then
  _settings = _settings:gsub("%%DROOT%%", ROOTDIR)
  SETTINGS = json.decode(_settings)
  MIMES = SETTINGS.mimes or {}
end
_settings = nil

local DEBUGMODE = SETTINGS.debugmode
local DISTDIR = SETTINGS.distdir or ROOTDIR.."/dist"
local TMPDIR = SETTINGS.tmpdir or "/tmp"

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

function fs_exists(request, response, path)
  local rpath = get_real_path(request, response, path)
  return false, fs.stat(rpath, 'type') == 'reg'
end

function fs_read(request, response, path)
  -- NOT AVAILABLE OVER HTTP
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

          if filesize == 0 and filemime ~= "application/octet-stream" then
            filemime = "inode/x-empty"
          end
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

  if name == "exists" then
    error, data = fs_exists(request, response, args[1])
  elseif name == "read" then
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
  elseif name == "remove" or name == "delete" then
    error, data = fs_remove(request, response, args[1])
  elseif name == "mkdir" then
    error, data = fs_mkdir(request, response, args[1])
  else
    error = "Invalid VFS method"
  end

  return error, data
end

-- ----------------------------------------------------------------------------
--                                  CORE API
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

-- ----------------------------------------------------------------------------
--                                   LUA API
-- ----------------------------------------------------------------------------

local function iface_status(ifaces)
  local netm = require "luci.model.network".init()
  local rv   = { }

  local iface
  for iface in ifaces:gmatch("[%w%.%-_]+") do
    local net = netm:get_network(iface)
    local device = net and net:get_interface()
    if device then
      local data = {
        id         = iface,
        proto      = net:proto(),
        uptime     = net:uptime(),
        gwaddr     = net:gwaddr(),
        dnsaddrs   = net:dnsaddrs(),
        name       = device:shortname(),
        type       = device:type(),
        ifname     = device:name(),
        macaddr    = device:mac(),
        is_up      = device:is_up(),
        rx_bytes   = device:rx_bytes(),
        tx_bytes   = device:tx_bytes(),
        rx_packets = device:rx_packets(),
        tx_packets = device:tx_packets(),

        ipaddrs    = { },
        ip6addrs   = { },
        subdevices = { }
      }

      local _, a
      for _, a in ipairs(device:ipaddrs()) do
        data.ipaddrs[#data.ipaddrs+1] = {
          addr      = a:host():string(),
          netmask   = a:mask():string(),
          prefix    = a:prefix()
        }
      end
      for _, a in ipairs(device:ip6addrs()) do
        if not a:is6linklocal() then
          data.ip6addrs[#data.ip6addrs+1] = {
            addr      = a:host():string(),
            netmask   = a:mask():string(),
            prefix    = a:prefix()
          }
        end
      end

      for _, device in ipairs(net:get_interfaces() or {}) do
        data.subdevices[#data.subdevices+1] = {
          name       = device:shortname(),
          type       = device:type(),
          ifname     = device:name(),
          macaddr    = device:mac(),
          macaddr    = device:mac(),
          is_up      = device:is_up(),
          rx_bytes   = device:rx_bytes(),
          tx_bytes   = device:tx_bytes(),
          rx_packets = device:rx_packets(),
          tx_packets = device:tx_packets(),
        }
      end

      rv[#rv+1] = data
    end
  end

  return rv
end

local function get_wlans(device)

  local iw = sys.wifi.getiwinfo(device)

  local function percent_wifi_signal(info)
    local qc = info.quality or 0
    local qm = info.quality_max or 0

    if info.bssid and qc > 0 and qm > 0 then
      return math.floor((100 / qm) * qc)
    else
      return 0
    end
  end

  local function format_wifi_encryption(info)
    if info.wep == true then
      return "WEP"
    elseif info.wpa > 0 then
      if info.wpa >= 2 then
        return "WPA2"
      end
      return "WPA"
    elseif info.enabled then
      return "Unknown"
    else
      return "Open"
    end
  end

  local function scanlist(times)
    local i, k, v
    local l = { }
    local s = { }

    for i = 1, times do
      for k, v in ipairs(iw.scanlist or { }) do
        if not s[v.bssid] then
          l[#l+1] = v
          s[v.bssid] = true
        end
      end
    end

    return l
  end

  local result = {}
  for i, net in ipairs(scanlist(1)) do
    net.encryption = net.encryption or { }

    local enc = format_wifi_encryption(net.encryption)
    if enc ~= nil then
      result[i] = {
        mode = net.mode,
        channel = net.channel,
        ssid = net.ssid,
        bssid = net.bssid,
        signal = percent_wifi_signal(net),
        encryption = enc
      }
    end
  end

  return result
end

local function console(cmd, back)
  if back then
    os.execute(cmd .. " &")
    return ""
  end

  local handle = io.popen(cmd)
  local result = handle:read("*a")
  handle:close()
  return result
end

-- ----------------------------------------------------------------------------
--                                     API
-- ----------------------------------------------------------------------------

function api_request(request, response, meth, iargs)
  local error = false
  local data = false

  --
  -- CORE API
  --
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
  elseif meth == "reboot" then
    data = os.execute("reboot >/dev/null 2>&1")

  --
  -- LUA API
  --

  elseif meth == "sysinfo" then
    local timezone = fs.readfile("/etc/TZ") or "UTC"
    -- timezone = timezone:gsub('%W', '')

    local metrics = {sys.sysinfo()}
    metrics[8] = sys.uptime()

    data = {
      metrics = metrics,
      hostname = sys.hostname(),
      timezone = timezone,
      rest = console("sh " .. ROOTDIR .. "/bin/arduino-toggle-rest-api.sh")
    }
  elseif meth == "setsysinfo" then
    local hostname = iargs.hostname or sys.hostname()
    local timezone = iargs.timezone or false

    sys.hostname(hostname)

    if timezone then
      fs.writefile("/etc/TZ", timezone)
    end

    console("/sbin/uci set system.@system[0].hostname=" .. hostname)
    console("/sbin/uci set system.@system[0].timezone=" .. timezone)
    console("/sbin/uci commit system")
    data = true
  elseif meth == "reboot" then
    sys.reboot()
    data = true
  elseif meth == "netdevices" then
    data = sys.net.devices()
  elseif meth == "netstatus" then
    data = iface_status(iargs["device"])
  elseif meth == "netinfo" then
    data = {
      deviceinfo = sys.net.deviceinfo(),
      ifconfig = json.decode(console("sh " .. ROOTDIR .. "/bin/arduino-ifconfig.sh"))
    }
  elseif meth == "iwinfo" then
    -- local device = iargs["device"] or "wlan0"
    -- data = sys.wifi.getiwinfo(device)
    data = console("sh " .. ROOTDIR .. "/bin/arduino-wifi-info.sh")
  elseif meth == "rest" then
    data = console("sh " .. ROOTDIR .. "/bin/arduino-toggle-rest-api.sh " .. iargs["enabled"])
  elseif meth == "iwscan" then
    local device = iargs["device"] or "radio0"
    data = get_wlans(device)
  elseif meth == "ps" then
    data = sys.process.list()
  elseif meth == "kill" then
    data = nixio.kill(iargs.pid, iargs.signal)
  elseif meth == "dmesg" then
    data = sys.dmesg()
  elseif meth == "syslog" then
    data = sys.syslog()
  elseif meth == "setpasswd" then
    username = get_username(request, response)
    data = sys.user.setpasswd(username, iargs["password"]) == 0
  elseif meth == "wifi" then
    local cssid = iargs["ssid"]:gsub("%$", "\\$")
    local cpass = iargs["password"]:gsub("%$", "\\$")
    data = console("sh " .. ROOTDIR .. '/bin/arduino-wifi-connect.sh "' .. cssid .. '" ' ..  iargs["security"] .. ' "' .. cpass .. '"', true)
  elseif meth == "opkg" then
    if iargs["command"] == "list" then
      if iargs["args"]["category"] == "all" then
        data = console("opkg list")
      elseif iargs["args"]["category"] == "installed" then
        data = console("opkg list-installed")
      else
        data = console("opkg list-upgradable")
      end
    elseif iargs["command"] == "remove" then
      data = console("opkg remove " .. iargs["args"]["packagename"])
    elseif iargs["command"] == "upgrade" then
      data = console("opkg upgrade " .. iargs["args"]["packagename"])
    elseif iargs["command"] == "install" then
      if iargs["args"]["packagename"] then
        data = console("opkg install " .. iargs["args"]["packagename"])
      else
        local rpath = get_real_path(request, response, iargs["args"]["filename"])
        data = console("opkg install " .. rpath)
      end
    end
  elseif meth == "exec" then
    data = console(iargs["command"])

  --
  -- MISC
  --

  else
    error = "Invalid API method"
  end

  return error, data
end

-- ----------------------------------------------------------------------------
--                                   EXPORTS
-- ----------------------------------------------------------------------------

return {
  ROOTDIR = ROOTDIR,
  DISTDIR = DISTDIR,
  SETTINGS = SETTINGS,

  api_request = api_request,
  get_session = get_session,
  get_real_path = get_real_path,
  get_file_mime = get_file_mime,
  get_username = get_username,
  get_user_home = get_user_home,
  get_user_settings_path = get_user_settings_path
}
