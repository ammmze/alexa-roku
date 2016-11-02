var ssdp = require('node-ssdp').Client;
var _ = require('lodash');
var Roku = require('roku');

// How many seconds before a last seen device falls out of the cache
const IDLE_TIME_SEC = 60;
var devices = {};

// array of devices from the last scan
var deviceCache=[];

function deviceSearch(timeout) {
    return new Promise(function(resolve) {
        timeout = timeout || 5000;
        var client = new ssdp();

        console.log('Searching for devices for ' + (timeout / 1000) + ' seconds');
        var numFound = 0;

        client.on('response', function inResponse(headers, code, rinfo) {
            // console.log('Got a response to an m-search:\n%d\n%s\n%s', code, JSON.stringify(headers, null, 4), JSON.stringify(rinfo, null, 4))
            const roku = new Roku(headers.LOCATION);
            const device = {deviceId: null, location: headers.LOCATION, lastSeen: new Date()};

            roku.info(function (err, info) {
                var parts = info.UDN.split(':');
                if (parts.length === 2) {
                    Object.assign(device, info, {deviceId: parts[1]});
                    if (!devices[headers.USN]) {
                        console.log('Found new device "' + device.friendlyName + '" at ' + device.location);
                        numFound++;
                    }
                    devices[headers.USN] = device;
                }
            })
        })

        client.search('roku:ecp');

        // And after N seconds, you want to stop
        setTimeout(function () {
            client.stop();

            console.log('Done searching. Found ' + numFound + ' new devices');

            // Remove any devices that we haven't seen in the last N seconds (default 60 seconds)
            const now = new Date().getTime();
            devices = _.pickBy(devices, function (device) {
                const isRecent = now - device.lastSeen.getTime() < IDLE_TIME_SEC * 1000;
                if (!isRecent) {
                    console.log('Haven\'t seen ' + device.friendlyName + ' in at least ' + IDLE_TIME_SEC + ' seconds. Removing from cache');
                }
                return isRecent;
            })

            resolve(_.values(devices));
        }, timeout)
    });
}

function getDevices(refresh, timeout) {
    return new Promise(function (resolve) {
        if (deviceCache.length > 0 && !refresh) {
            resolve(deviceCache);
            return;
        }
        deviceSearch(timeout).then(function(devices) {
            deviceCache = devices;
            // console.log('Updating device cache with ' + devices.length + ' device(s)', 
            //     JSON.stringify(_.map(devices, function(obj) { return _.pick(obj, 'friendlyName', 'location', 'modelName', 'modelNumber') })));
            resolve(devices);
        });
    })
}




module.exports = {search: deviceSearch, get: getDevices}
