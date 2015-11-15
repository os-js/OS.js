#!/usr/bin/lua

local sys = require "luci.sys"
local osjs = require "osjs"
local fs = require "nixio.fs"

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
      if info.wpa == 3 then
        return "WPA/WPA2"
      elseif info.wpa == 2 then
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
  for i, net in ipairs(scanlist(3)) do
    net.encryption = net.encryption or { }

    result[i] = {
      mode = net.mode,
      channel = net.channel,
      ssid = net.ssid,
      bssid = net.bssid,
      signal = percent_wifi_signal(net),
      encryption = format_wifi_encryption(net.encryption)
    }
  end

  return result
end

local function request(m, a, request, response)

  local result = false

  if m == "sysinfo" then
    local timzone = fs.readFile("/etc/TZ") or "UTC"
    local metrics = {sys.sysinfo()}
    metrics[8] = sys.uptime()

    result = {
      metrics = metrics,
      hostname = sys.hostname(),
      timezone = timezone
    }
  elseif m == "setsysinfo" then
    local hostname = a.hostname or sys.hostname()
    local timezone = a.timezone or false

    sys.hostname(hostname)

    if timezone then
      fs.writefile("/etc/TZ", timezone)
    end

    result = true
  elseif m == "reboot" then
    sys.reboot()
    result = true
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
  elseif m == "iwscan" then
    local device = a["device"] or "radio0"
    result = get_wlans(device)
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

