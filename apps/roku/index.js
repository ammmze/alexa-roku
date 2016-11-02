var alexa = require('alexa-app');
var actions = require('./src/actions');

var app = new alexa.app('roku');

console.log('Starting up the roku app');

// Initiate the first search
actions.initiateDeviceSearch();

const ensureDeviceFailed = function(reprompt) {
    console.log('failed to get an active device');
    reprompt.response.say('Sorry, could not get an active Roku device');
    reprompt.response.send();
};

app.intent('activate_device', {
    slots: {'device_name': 'LITERAL'},
    utterances: ['activate {-|device_name}']
}, function (request, response) {
    actions.activateDevice(request.slot('device_name'), request, response)
        .then(function (device) {
            response.say('Alright, we\'ve activated ' + device.friendlyName);
            response.send();
        })
        .catch(function () {
            response.say('Sorry, we couldn\'t find a Roku named ' + request.slot('device_name'));
            response.send();
        });
    return false;
});

app.intent('launch_app', {
    slots: {'app_name': 'LITERAL'},
    utterances: ['{launch|open|start} {-|app_name}']
}, function(request, response) {
    actions.ensureHasDevice(request, response)
        .then(function (reprompt) {
            console.log('starting ' + request.slot('app_name'), !!reprompt.response.say);
            reprompt.response.say('Starting ' + request.slot('app_name') + ' on ' + actions.userState(reprompt.request.userId).deviceName);
            reprompt.response.send();
            actions.userState(reprompt.request.userId).device.launch(request.slot('app_name'));
        })
        .catch(ensureDeviceFailed);
    return false;
});

app.intent('type', {
    slots: {'phrase': 'LITERAL'},
    utterances: ['{type|write|enter} {-|phrase}']
}, function(request, response) {
    actions.ensureHasDevice(request, response)
        .then(function (reprompt) {
            reprompt.response.say('Typing ' + request.slot('phrase') + ' on ' + actions.userState(reprompt.request.userId).deviceName);
            reprompt.response.send();
            actions.userState(reprompt.request.userId).device.type(request.slot('phrase'));
        })
        .catch(ensureDeviceFailed);
    return false;
});

app.intent('press', {
    slots: {'key': 'LITERAL'},
    utterances: ['{press|go} {-|key}']
}, function(request, response) {
    actions.ensureHasDevice(request, response)
        .then(function (reprompt) {
            var key = request.slot('key');
            switch (key.toLowerCase()) {
                case 'select':
                case 'ok':
                case 'okay':
                    key = 'select';
                    break;
                case 'rev':
                case 'rewind':
                case 'reverse':
                    key = 'rev';
                    break;
                case 'fwd':
                case 'forward':
                case 'fast forward':
                    key = 'fwd';
                    break;
                case 'instantreplay':
                case 'instant replay':
                case 'replay':
                    key = 'instantreplay';
                    break;
                case 'home':
                case 'play':
                case 'left':
                case 'right':
                case 'down':
                case 'up':
                case 'back':
                case 'info':
                case 'backspace':
                case 'search':
                case 'enter':
                    // leave as-is
                    break;
                default:
                    reprompt.response.say('Sorry, I don\'t know the button ' + key);
                    reprompt.response.send();
                    return;
            }
            const msg = 'Pressing ' + key + ' on ' + actions.userState(reprompt.request.userId).deviceName;
            console.log(msg);
            reprompt.response.say(msg);
            reprompt.response.send();
            actions.userState(reprompt.request.userId).device.press(key);
        })
        .catch(ensureDeviceFailed);
    return false;
});

app.intent('reprompt', {
    slots: {'reprompt': 'LITERAL'},
    utterances: ['{-|reprompt}']
}, function(request, response) {
    if (actions.userState(request.userId).repromptAction) {
        actions.userState(request.userId).repromptAction(request, response, request.slot('reprompt'));
        return false;
    }
    response.say('Sorry, I\'m not sure what to do with your request');
});

module.exports = app;
