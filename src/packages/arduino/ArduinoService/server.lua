#!/usr/bin/lua

local sys = require "luci.sys"
local osjs = require "osjs"

local function request(m, a, request, response)

  local result = false

  if m == "sysinfo" then
    result = {sys.sysinfo()}
    result[8] = sys.uptime()
  elseif m == "netdevices" then
    result = sys.net.devices()
  elseif m == "netinfo" then
    result = {
      deviceinfo = sys.net.deviceinfo(),
      arptable = sys.net.arptable()
    }
  elseif m == "iwinfo" then
    local device = a["device"] or "wlan0"
    result = sys.wifi.getiwinfo(device)
  elseif m == "ps" then
    result = sys.process.list()
  elseif m == "setpasswd" then
    username = osjs.get_username(request, response)
    result = sys.user.setpasswd(username, a["password"]) == 0
  end

  return false, result

end

return {
  request = request
}

