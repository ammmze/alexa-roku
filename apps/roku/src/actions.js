var _ = require('lodash');
var levenshtein = require('fast-levenshtein');
var Roku = require('roku');
var getDevices = require('./devices').get;

const actions = {};
module.exports = actions;

// contains user state ... like what device they were last using {"userId": {deviceId: "deviceId", lastSeen: "new Date"}}
const userState = {};

actions.userState = function (userId) {
    return userState[userId] || (userState[userId] = {});
};

actions.initiateDeviceSearch = function () {
    getDevices(true);
    setInterval(_.partial(getDevices, true), (process.env.DEVICE_SCAN_FREQ_SEC || 60) * 1000);
};

actions.activateDevice = function (deviceName, request, response) {
    return new Promise(function (resolve, reject) {
        getDevices().then(function (devices) {
            var bestMatch = null;
            var bestDistance = null;
            _.forEach(devices, function(device) {
                // TODO: this could probably be done a different way...better...maybe do most matching words instead?
                const name1 = device.friendlyName.toLowerCase();
                const name2 = deviceName.toLowerCase();
                const distance = levenshtein.get(name1, name2);
                const diffRatio = distance / _.max([name1.length, name2.length]);
                console.log('Comparing names', name1, name2, 'distance', distance);
                if ((bestDistance === null || distance < bestDistance) && diffRatio < 0.8) {
                    bestDistance = distance;
                    bestMatch = device;
                }
            });
            if (bestMatch) {
                actions.userState(request.userId).device = new Roku(bestMatch.location);
                actions.userState(request.userId).deviceId = bestMatch.deviceId;
                actions.userState(request.userId).deviceName = bestMatch.friendlyName;
                actions.userState(request.userId).deviceLastUsed = new Date();
                resolve(bestMatch);
            } else {
                reject();
            }
        });
    });
};

actions.hasDevice = function (request) {
    return !!actions.userState(request.userId).deviceId;
};

actions.ensureHasDevice = function (request, response) {
    if (actions.hasDevice(request)) {
        return new Promise(function (resolve) {
            resolve({request: request, response: response});
        });
    }
    response
        .say('Looks like you need to select a Roku device.')
        .reprompt('Which Roku device would like to use?')
        .shouldEndSession(false);
    response.send();
    const action = function (request, response, reply) {
        return actions.activateDevice(reply, request, response);
    };
    return actions.repromptAction(request, response, action);
};

actions.repromptAction = function (request, response, action) {
    var resolver = null, rejecter = null;
    actions.userState(request.userId).repromptAction = function (request, response, reply) {
        actions.userState(request.userId).repromptAction = null;
        if (action) {
            return action(request, response, reply)
                .then(function () {
                    resolver({ request: request, response: response });
                })
                .catch(function () {
                    rejecter({ request: request, response: response });
                })
        } else {
            resolver({ request: request, response: response });
            return true;
        }
    };
    return new Promise(function (resolve, reject) {
        resolver = resolve;
        rejecter = reject;
    });
};
