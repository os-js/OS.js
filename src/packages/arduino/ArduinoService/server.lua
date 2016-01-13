#!/usr/bin/lua

local sys = require "luci.sys"
local osjs = require "osjs"
local nixio = require "nixio"
local fs = require "nixio.fs"
local json = require "luci.json"

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
      if info.wpa == 3 then
        -- return "WPA/WPA2"
        return nil
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

local function request(m, a, request, response)

  local result = false

  local function console(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return result
  end

  if m == "sysinfo" then
    local timezone = fs.readfile("/etc/TZ") or "UTC"
    timezone = timezone:gsub('%W', '')
    local metrics = {sys.sysinfo()}
    metrics[8] = sys.uptime()

    result = {
      metrics = metrics,
      hostname = sys.hostname(),
      timezone = timezone,
      rest = console("sh /opt/osjs/bin/arduino-toggle-rest-api.sh")
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
  elseif m == "netstatus" then
    result = iface_status(a["device"])
  elseif m == "netinfo" then
    result = {
      deviceinfo = sys.net.deviceinfo(),
      ifconfig = json.decode(console("sh /opt/osjs/bin/arduino-ifconfig.sh"))
    }
  elseif m == "iwinfo" then
    -- local device = a["device"] or "wlan0"
    -- result = sys.wifi.getiwinfo(device)
    result = console("sh /opt/osjs/bin/arduino-wifi-info.sh")
  elseif m == "rest" then
    result = console("sh /opt/osjs/bin/arduino-toggle-rest-api.sh " .. a["enabled"])
  elseif m == "iwscan" then
    local device = a["device"] or "radio0"
    result = get_wlans(device)
  elseif m == "ps" then
    result = sys.process.list()
  elseif m == "kill" then
    result = nixio.kill(a.pid, a.signal)
  elseif m == "dmesg" then
    result = sys.dmesg()
  elseif m == "syslog" then
    result = sys.syslog()
  elseif m == "setpasswd" then
    username = osjs.get_username(request, response)
    result = sys.user.setpasswd(username, a["password"]) == 0
  elseif m == "wifi" then
    result = console("sh /opt/osjs/bin/arduino-wifi-connect.sh " .. a["ssid"] .. " " ..  a["security"] .. " " .. a["password"])
  elseif m == "opkg" then
    if a["command"] == "list" then
      if a["args"]["category"] == "all" then
        result = console("opkg list")
      elseif a["args"]["category"] == "installed" then
        result = console("opkg list-installed")
      else
        result = console("opkg list-upgradable")
      end
    elseif a["command"] == "remove" then
      result = console("opkg remove " .. a["args"]["packagename"])
    elseif a["command"] == "upgrade" then
      result = console("opkg upgrade " .. a["args"]["packagename"])
    elseif a["command"] == "install" then
      if a["args"]["packagename"] then
        result = console("opkg install " .. a["args"]["packagename"])
      else
        local rpath = osjs.get_real_path(request, response, a["args"]["filename"])
        result = console("opkg install " .. rpath)
      end
    end
  elseif m == "exec" then
    result = console(a["command"])
  end

  return false, result

end

return {
  request = request
}

