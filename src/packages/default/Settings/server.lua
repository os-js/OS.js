#!/usr/bin/lua

local sys = require "luci.sys"
local osjs = require "osjs"


function setpasswd(username, password)
  if password then
    password = password:gsub("'", [['"'"']])
  end

  if username then
    username = username:gsub("'", [['"'"']])
  end

  return os.execute(
  "(echo '" .. password .. "'; sleep 1; echo '" .. password .. "') | " ..
  "passwd '" .. username .. "' >/dev/null 2>&1"
  )
end


local function request(m, a, request, response)

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
  elseif m == "setpasswd" then
    username = osjs.get_username(request, response)
    result = setpasswd(username, a["password"]) == 0
  end

  return false, result

end

return {
  request = request
}

