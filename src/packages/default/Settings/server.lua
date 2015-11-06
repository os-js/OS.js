#!/usr/bin/lua

local sys = require "luci.sys"

local function request(m, a)

  local result = false

  if m == "sysinfo" then
    local sysinfo = {sys.sysinfo()}
    result = {
      platform = sysinfo[1],
      model = sysinfo[2],
      total_memory = sysinfo[3],
      cache_memory = sysinfo[4],
      buffer_memory = sysinfo[5],
      free_memory = sysinfo[6],
      bogomips = sysinfo[7],
      uptime = sys.uptime()
    }
  elseif m == "netdevices" then
    result = sys.net.devices()
  elseif m == "netinfo" then
    result = sys.net.deviceinfo()
  elseif m == "iwinfo" then
    local device = a["device"] or "wlan0"
    result = sys.wifi.getiwinfo(device)
  elseif m == "ps" then
    result = sys.process.list()
  end

  return false, result

end

return {
  request = request
}

