/**
 * sonnen adapter
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils = require(__dirname + '/lib/utils'); // Get common adapter utils
const adapter = new utils.Adapter('sonnen');
const request = require('request');

// when adapter shuts down
adapter.on('unload', callback => {
    try {
        adapter.log.info('[END] Stopping sonnen adapter...');
        adapter.setState('info.connection', false, true);
        callback();
    } catch (e) {
        callback();
    }
});


// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', obj => {
    if (typeof obj === 'object' && obj.message) {
        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
adapter.on('ready', () => {
    if (adapter.config.ip) {
        adapter.log.info('[START] Starting sonnen adapter');
        main();
    } else adapter.log.warn('[START] No IP-address set');
});

function main() {
    // Vars
    const ip = adapter.config.ip;
    const pollingTime = adapter.config.pollInterval || 7000;
    adapter.log.debug('[INFO] Configured polling interval: ' + pollingTime);
    const statusUrl = 'http://' + ip + ':8080/api/v1/status'; // Status Path - api/status --> GET
    let polling = null;

    adapter.log.debug('[START] Started Adapter with: ' + ip);

    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
        if (!id || !state || state.ack) return; // Ignore acknowledged state changes or error states
        id = id.substring(adapter.namespace.length + 1); // remove instance name and id
        state = state.val;

        adapter.log.debug('[COMMAND] State Change - ID: ' + id + '; State: ' + state);

        if (id === 'control.charge') {
            request.put('http://' + ip + ':8080/api/v1/setpoint/charge/' + state, (error, response, body) => {
                if (response && response.statusCode.toString() === '200') {
                    adapter.setState('control.charge', state, true);
                    adapter.log.debug('[PUT] ==> Sent ' + state + ' to charge')
                } else adapter.log.warn('[PUT] Error ' + error)
            });
        } else if (id === 'control.discharge') {
            request.put('http://' + ip + ':8080/api/v1/setpoint/discharge/' + state, (error, response, body) => {
                if (response && response.statusCode.toString() === '200') {
                    adapter.setState('control.discharge', state, true);
                    adapter.log.debug('[PUT] ==> Sent ' + state + ' to discharge')
                } else adapter.log.warn('[PUT] Error ' + error)
            });
        } // endElseIf
    });

    request(statusUrl, (error, response, body) => { // poll states on start
        if (error) adapter.log.warn('[REQUEST] <== ' + error);
        if (response && response.statusCode.toString() === '200') {
            adapter.getState('info.connection', (err, state) => {
                if (!state || !state.val) {
                    adapter.setState('info.connection', true, true);
                    adapter.log.debug('[CONNECT] Connection successful established');
                } // endIf
            });
            setBatteryStates(JSON.parse(body));
        } else {
            adapter.setState('info.connection', false, true);
            adapter.log.warn('[CONNECT] Connection failed');
        }// endElse
    });

    if (!polling) {
        polling = setInterval(() => { // poll states every [30] seconds
            request(statusUrl, (error, response, body) => {
                if (error) adapter.log.warn('[REQUEST] <== ' + error);
                if (response && response.statusCode.toString() === '200') {
                    adapter.getState('info.connection', (err, state) => {
                        if (!state || !state.val) {
                            adapter.setState('info.connection', true, true);
                            adapter.log.debug('[CONNECT] Connection successful established');
                        } // endIf
                    });
                    setBatteryStates(JSON.parse(body));
                } else {
                    adapter.setState('info.connection', false, true);
                    adapter.log.warn('[CONNECT] Connection failed');
                } // endElse
            });
        }, pollingTime);
    } // endIf

    // all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    adapter.getForeignObject(adapter.namespace, (err, obj) => { // create device namespace
        if (!obj) {
            adapter.setForeignObject(adapter.namespace, {
                type: 'device',
                common: {
                    name: 'sonnen device'
                }
            });
        } // endIf
    });

    /*
     * Internals
     */
    function setBatteryStates(json, cb) {
        adapter.setState('info.lastSync', new Date().toISOString(), true);
        adapter.setState('status.consumption', json.Consumption_W, true);
        adapter.setState('status.batteryCharging', json.BatteryCharging, true);
        adapter.setState('status.production', json.Production_W, true);
        adapter.setState('status.pacTotal', json.Pac_total_W, true);
        adapter.setState('status.relativeSoc', json.RSOC, true);
        adapter.setState('status.userSoc', json.USOC, true);
        adapter.setState('status.acFrequency', json.Fac, true);
        adapter.setState('status.acVoltage', json.Uac, true);
        adapter.setState('status.batteryVoltage', json.Ubat, true);
        adapter.setState('status.systemTime', new Date(json.Timestamp).toISOString(), true);
        if (json.IsSystemInstalled === 1)
            adapter.setState('status.systemInstalled', true, true);
        else
            adapter.setState('status.systemInstalled', false, true);
        adapter.setState('status.gridFeedIn', json.GridFeedIn_W, true);
        adapter.setState('status.flowConsumptionBattery', json.FlowConsumptionBattery, true);
        adapter.setState('status.flowConsumptionGrid', json.FlowConsumptionGrid, true);
        adapter.setState('status.flowConsumptionProduction', json.FlowConsumptionProduction, true);
        adapter.setState('status.flowGridBattery', json.FlowGridBattery, true);
        adapter.setState('status.flowProductionBattery', json.FlowProductionBattery, true);
        adapter.setState('status.flowProductionGrid', json.FlowProductionGrid, true);

        if (cb && typeof(cb) === "function") return cb();
    } // endSetBatteryStates

} // endMain
