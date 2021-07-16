/**
 * sonnen adapter
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils = require(`@iobroker/adapter-core`); // Get common adapter utils
const helper = require(`${__dirname}/lib/utils`);
const requestPromise = require(`request-promise-native`);
let polling;
let ip;
let adapter;
let pollingTime;
let apiVersion;
let restartTimer;
let powermeterCreated = false;
const requestOptions = {headers: {}};
let inverterEndpoint = false;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: `sonnen`
    });

    adapter = new utils.Adapter(options);

    adapter.on(`unload`, async callback => {
        try {
            clearTimeout(polling);
            if (restartTimer) {
                clearTimeout(restartTimer);
            }
            adapter.log.info(`[END] Stopping sonnen adapter...`);
            await adapter.setStateAsync(`info.connection`, false, true);
            callback();
        } catch (e) {
            callback();
        }
    });

    adapter.on(`ready`, async () => {
        if (adapter.config.ip) {
            ip = adapter.config.ip;
            adapter.log.info(`[START] Starting sonnen adapter`);
            adapter.log.debug(`[START] Check API`);
            if (adapter.config.token) {
                adapter.log.debug('[START] Auth-Token provided... trying official API');
                requestOptions.headers['Auth-Token'] = adapter.config.token;
                try {
                    await requestPromise({url: `http://${ip}/api/v2/latestdata`, ...requestOptions});
                    apiVersion = `v2`;
                    adapter.log.debug('[START] Check ok, using official API');
                    return void main();
                } catch (e) {
                    adapter.log.error(`Auth-Token provided, but could not use official API: ${e.message}`);
                }
            }

            try {
                await requestPromise({url: `http://${ip}:8080/api/v1/status`, timeout: 2000});
                adapter.log.debug(`[START] 8080 API detected`);
                apiVersion = `new`;
                return void main();
            } catch (e) {
                adapter.log.debug(`[START] It's not 8080, because ${e.message}`);
            }

            try {
                // test if both works, else use legacy, because of incomplete implementation of API
                await requestPromise(`http://${ip}:7979/rest/devices/battery/M03`);
                await requestPromise(`http://${ip}:7979/rest/devices/battery/M034`);
                apiVersion = `old`;
                adapter.log.debug(`[START] 7979 API detected`);
                return void main();
            } catch(e) {
                adapter.log.debug(`[START] It's not 7979, because ${e.message}`);
            }

            try {
                await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
                apiVersion = 'legacy';
                return void main();
            } catch (e) {
                adapter.log.warn(`[START] Could not get API version... restarting in 30 seconds: ${e.message}`);
                restartTimer = setTimeout(adapter.restart, 30000);
            }
        } else {
            adapter.log.warn(`[START] No IP-address set`);
        }
    });

    adapter.on(`stateChange`, async (id, state) => {
        if (!id || !state || state.ack) {
            return;
        } // Ignore acknowledged state changes or error states
        id = id.substring(adapter.namespace.length + 1); // remove instance name and id
        state = state.val;

        adapter.log.debug(`[COMMAND] State Change - ID: ${id}; State: ${state}`);

        if (id === `control.charge`) {
            try {
                if (apiVersion === 'v2') {
                    await requestPromise.post({url: `http://${ip}/api/v2/setpoint/charge/${state}`, ...requestOptions});
                } else {
                    await requestPromise.put({url: `http://${ip}:8080/api/v1/setpoint/charge/${state}`});
                }
                adapter.setState(`control.charge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${state} to charge`);
            } catch (e) {
                adapter.log.warn(`[PUT] Error ${e.message}`);
            }
        } else if (id === `control.discharge`) {
            try {
                if (apiVersion === 'v2') {
                    await requestPromise.post({url: `http://${ip}/api/v2/setpoint/discharge/${state}`, ...requestOptions});
                } else {
                    await requestPromise.put({url: `http://${ip}:8080/api/v1/setpoint/discharge/${state}`});
                }
                adapter.setState(`control.discharge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${state} to discharge`);
            } catch (e) {
                adapter.log.warn(`[PUT] Error ${e.message}`);
            }
        } // endElseIf
    });

    return adapter;
} // endStartAdapter

async function main() {
    pollingTime = adapter.config.pollInterval || 7000;
    adapter.log.debug(`[INFO] Configured polling interval: ${pollingTime}`);
    // all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates(`*`);

    // create device namespace
    await adapter.setForeignObjectNotExistsAsync(adapter.namespace, {
        type: `device`,
        common: {
            name: `sonnen device`
        }
    });

    adapter.log.debug(`[START] Started Adapter with: ${ip}`);

    if (apiVersion === `old`) {
        return void oldAPImain();
    }

    if (apiVersion === 'legacy') {
        return void legacyAPImain();
    }

    const statusUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/status` : `http://${ip}:8080/api/v1/status`;

    // create objects
    const promises = [];
    for (const obj of helper.newAPIStates) {
        const id = obj._id;
        delete obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, {preserve: {common: ['name']}}));
    }

    await Promise.all(promises);

    try {
        const data = await requestPromise(statusUrl); // poll states on start
        const state = await adapter.getStateAsync(`info.connection`);
        if (!state || !state.val) {
            adapter.setState(`info.connection`, true, true);
            adapter.log.debug(`[CONNECT] Connection successfuly established`);
        } // endIf
        adapter.log.debug(`[DATA] <== ${data}`);
        setBatteryStates(JSON.parse(data));
    } catch (e) {
        adapter.log.warn(`[REQUEST] <== ${e.message}`);
        adapter.setState(`info.connection`, false, true);
        adapter.log.warn(`[CONNECT] Connection failed`);
    }

    try {
        await requestSettings();
    } catch (e) {
        adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
    }

    try {
        await requestInverterEndpoint();
        await requestPowermeterEndpoint();
        await requestOnlineStatus();
    } catch (e) {
        adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
    }

    const pollStates = (async () => { // poll states every [30] seconds
        try {
            const data = await requestPromise(statusUrl);
            const state  = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            } // endIf
            setBatteryStates(JSON.parse(data));
            try {
                await requestInverterEndpoint();
                await requestPowermeterEndpoint();
                await requestOnlineStatus();
            } catch (e) {
                adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
            }

            try {
                await requestSettings();
            } catch (e) {
                adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
            }
        } catch (e) {
            adapter.log.warn(`[REQUEST] <== ${e.message}`);
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }

        polling = setTimeout(pollStates, pollingTime);
    });

    pollStates();
} // endMain

/*
 * Internals
 */
async function oldAPImain() {
    // create objects
    let promises = [];
    for (const obj of helper.oldAPIStates) {
        const id = obj._id;
        delete obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, {preserve: {common: ['name']}}));
    }

    await Promise.all(promises);
    promises = [];
    promises.push(requestStateAndSetOldAPI(`M03`, `status.production`));
    promises.push(requestStateAndSetOldAPI(`M04`, `status.consumption`));
    promises.push(requestStateAndSetOldAPI(`M05`, `status.relativeSoc`));
    promises.push(requestStateAndSetOldAPI(`M06`, `status.operatingMode`));
    promises.push(requestStateAndSetOldAPI(`M07`, `status.consumptionL1`));
    promises.push(requestStateAndSetOldAPI(`M08`, `status.consumptionL2`));
    promises.push(requestStateAndSetOldAPI(`M09`, `status.consumptionL3`));
    promises.push(requestStateAndSetOldAPI(`M34`, `status.pacDischarge`));
    promises.push(requestStateAndSetOldAPI(`M35`, `status.pacCharge`));

    try {
        await Promise.all(promises);
        const lastSync = new Date();
        adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);
        const state = await adapter.getStateAsync(`info.connection`);
        if (!state.val) {
            adapter.setState(`info.connection`, true, true);
        }
    } catch (e) {
        adapter.log.warn(`[DATA] Error getting Data ${e.message}`);
    }

    const pollStates = (async () => { // poll states every configured seconds
        const promises = [];
        promises.push(requestStateAndSetOldAPI(`M03`, `status.production`));
        promises.push(requestStateAndSetOldAPI(`M04`, `status.consumption`));
        promises.push(requestStateAndSetOldAPI(`M05`, `status.relativeSoc`));
        promises.push(requestStateAndSetOldAPI(`M06`, `status.operatingMode`));
        promises.push(requestStateAndSetOldAPI(`M34`, `status.pacDischarge`));
        promises.push(requestStateAndSetOldAPI(`M35`, `status.pacCharge`));
        promises.push(requestStateAndSetOldAPI(`M07`, `status.consumptionL1`));
        promises.push(requestStateAndSetOldAPI(`M08`, `status.consumptionL2`));
        promises.push(requestStateAndSetOldAPI(`M09`, `status.consumptionL3`));

        try {
            await Promise.all(promises);
            const lastSync = new Date();
            adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state.val) {
                adapter.setState(`info.connection`, true, true);
            }
        } catch (e) {
            const state = await adapter.getStateAsync(`info.connection`);
            if (state.val === true) {
                adapter.setState(`info.connection`, false, true);
            }
            adapter.log.warn(`[DATA] Error getting Data ${e.message}`);
        }

        polling = setTimeout(pollStates, pollingTime);
    });

    pollStates();
} // endOldAPImain

async function legacyAPImain() {
    // here we store the id of the battery
    let batteryId;
    try {
        let data = await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
        data = JSON.parse(data);

        // we got data successfully -> mark as connected
        adapter.setState(`info.connection`, true, true);
        adapter.log.debug(`[CONNECT] Connection successfuly established`);

        for (const device of Object.values(data.devices)) {
            if (device.parent === 0) {
                batteryId = device.id;
                // create channel
                await adapter.setObjectNotExistsAsync('main', {
                    type: 'channel',
                    common: {
                        name: 'Main information'
                    },
                    native: {}
                });

                // this should be the sonnen battery
                for (const attr of Object.keys(device)) {
                    const stateVal = convertLegacyState(device[attr]);
                    await adapter.setObjectNotExistsAsync(`main.${attr}`, {
                        type: 'state',
                        common: {
                            name: attr,
                            read: true,
                            write: false,
                            type: typeof stateVal,
                            def: stateVal,
                            role: 'state'
                        },
                        native: {}
                    });
                }
            }
        }

        for (const device of Object.values(data.devices)) {
            if (device.parent === batteryId) {
                await adapter.setObjectNotExistsAsync(device.id.toString(), {
                    type: 'channel',
                    common: {
                        name: device.name
                    },
                    native: {}
                });

                for (const attr of Object.keys(device)) {
                    const stateVal = convertLegacyState(device[attr]);
                    await adapter.setObjectNotExistsAsync(`${device.id}.${attr}`, {
                        type: 'state',
                        common: {
                            read: true,
                            write: false,
                            name: attr,
                            type: typeof stateVal,
                            def: stateVal,
                            role: 'state'
                        }
                    });
                }
            }
        }
    } catch (e) {
        adapter.log.error(`Could not get initial data - restarting adapter: ${e.message}`);
        return void adapter.restart();
    }

    const pollStates = (async () => {
        try {
            let data = await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
            data = JSON.parse(data);

            for (const device of Object.values(data.devices)) {
                if (device.id === batteryId) {
                    for (const attr of Object.keys(device)) {
                        const stateVal = convertLegacyState(device[attr]);
                        await adapter.setStateAsync(`main.${attr}`, stateVal, true);
                    }
                } else if (device.parent === batteryId) {
                    for (const attr of Object.keys(device)) {
                        const stateVal = convertLegacyState(device[attr]);
                        await adapter.setStateAsync(`${device.id}.${attr}`, stateVal, true);
                    }
                }
            }

            // update the lastSync manually
            const lastSync = new Date();
            adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);

            // update the info connection state
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            } // endIf
        } catch (e) {
            adapter.log.warn(`[REQUEST] <== ${e.message}`);
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }

        setTimeout(pollStates, pollingTime);
    });

    pollStates();
}

/**
 * Converts a state value to the correct type
 * @param {any} stateVal - state value to convert
 */
function convertLegacyState(stateVal) {
    if (stateVal === 'TRUE') {
        return true;
    }

    if (stateVal === 'FALSE') {
        return false;
    }

    if (!isNaN(stateVal)) {
        // it's a number
        return parseFloat(stateVal);
    }

    return stateVal;
}

async function requestSettings() {
    const data = await requestPromise(`http://${ip}:8080/api/configuration`);
    adapter.log.debug(`[SETTINGS] Configuration received: ${data}`);
    await adapter.setStateAsync(`info.configuration`, data, true);
} // endRequestSettings

async function requestInverterEndpoint() {
    try {
        let data = await requestPromise(`http://${ip}:8080/api/inverter`);
        const promises = [];

        promises.push(adapter.setStateAsync(`info.inverter`, data, true));
        data = JSON.parse(data);

        const relevantStates = [
            'iac1',
            'iac2',
            'iac3',
            'uac1',
            'uac2',
            'uac3',
            'udc',
            'temphmi',
            'tempbdc',
            'temppu',
            'pac1',
            'pac2',
            'pac3'
        ];

        for (const state of relevantStates) {
            // inverter states are string but are all numbers
            promises.push(adapter.setStateAsync(`inverter.${state}`, parseFloat(data.status[state]), true));
        }

        await Promise.all(promises);
        // inverter endpoint exists
        inverterEndpoint = true;
    } catch (e) {
        if (inverterEndpoint) {
            throw new Error(`Could not request inverter endpoint: ${e.message}`);
        } else {
            // not all batteries seem to have this endpoint so don't throw an error if it was never there, see Issue #55
            adapter.log.debug(`Could not request inverter endpoint: ${e.message}`);
        }
    }
} // endRequestInverterEndpoint

/**
 * request online status of the battery
 *
 * @return {Promise<void>}
 */
async function requestOnlineStatus() {
    try {
        let data = await requestPromise(`http://${ip}/api/online_status`);
        if (data === `true`) {
            data = true;
        } else if (data === `false`) {
            data = false;
        } else {
            throw new Error(`Expected string with "true" or "false" as onlineStatus, got "${data}"`);
        }

        await adapter.setStateAsync(`status.onlineStatus`, data, true);
    } catch (e) {
        throw new Error(`Could not request online status: ${e.message}`);
    }
}

async function requestPowermeterEndpoint() {
    try {
        let data = await requestPromise(`http://${ip}:8080/api/powermeter`);
        const promises = [];
        promises.push(adapter.setStateAsync(`info.powerMeter`, data, true));
        data = JSON.parse(data);

        const relevantStates = [
            'a_l1',
            'a_l2',
            'a_l3',
            'v_l1_l2',
            'v_l2_l3',
            'v_l3_l1',
            'v_l1_n',
            'v_l2_n',
            'v_l3_n',
            'kwh_exported',
            'kwh_imported',
            'w_l1',
            'w_l2',
            'w_l3'
        ];

        // we have multiple powermeters
        for (const pm of Object.keys(data)) {
            for (const state of relevantStates) {
                if (!powermeterCreated) {
                    const objs = helper.getPowermeterStates(pm, data[pm].direction);
                    for (const obj of objs) {
                        const id = obj._id;
                        delete obj._id;
                        await adapter.extendObjectAsync(id, obj);
                    }
                }

                promises.push(adapter.setStateAsync(`powermeter.${pm}.${state}`, data[pm][state], true));
            }
        }

        // all powermeters created
        powermeterCreated = true;

        await Promise.all(promises);
    } catch (e) {
        throw new Error(`Could not request powermeter endpoint: ${e.message}`);
    }
} // endRequestPowermeterEndpoint

function setBatteryStates(json) {
    if (json.ReturnCode) {
        adapter.log.warn(`[DATA] <== Return Code ${json.ReturnCode}`);
        return;
    } // endIf
    const lastSync = new Date();
    adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);
    adapter.setState(`status.consumption`, json.Consumption_W, true);
    adapter.setState(`status.batteryCharging`, json.BatteryCharging, true);
    adapter.setState(`status.production`, json.Production_W, true);
    adapter.setState(`status.pacTotal`, json.Pac_total_W, true);
    adapter.setState(`status.relativeSoc`, json.RSOC, true);
    adapter.setState(`status.userSoc`, json.USOC, true);
    adapter.setState(`status.acFrequency`, json.Fac, true);
    adapter.setState(`status.acVoltage`, json.Uac, true);
    adapter.setState(`status.batteryVoltage`, json.Ubat, true);
    const systemTime = new Date(json.Timestamp);
    adapter.setState(`status.systemTime`, new Date(systemTime - systemTime.getTimezoneOffset() * 60000).toISOString(), true);
    if (json.IsSystemInstalled === 1) {
        adapter.setState(`status.systemInstalled`, true, true);
    } else {
        adapter.setState(`status.systemInstalled`, false, true);
    }
    adapter.setState(`status.gridFeedIn`, json.GridFeedIn_W, true);
    adapter.setState(`status.flowConsumptionBattery`, json.FlowConsumptionBattery, true);
    adapter.setState(`status.flowConsumptionGrid`, json.FlowConsumptionGrid, true);
    adapter.setState(`status.flowConsumptionProduction`, json.FlowConsumptionProduction, true);
    adapter.setState(`status.flowGridBattery`, json.FlowGridBattery, true);
    adapter.setState(`status.flowProductionBattery`, json.FlowProductionBattery, true);
    adapter.setState(`status.flowProductionGrid`, json.FlowProductionGrid, true);
} // endSetBatteryStates

async function requestStateAndSetOldAPI(code, state) {
    let res = await requestPromise(`http://${ip}:7979/rest/devices/battery/${code}`);
    res = res.trim();
    adapter.log.debug(`[DATA] Received ${res} for ${code} and set it to ${state}`);
    adapter.setState(state, parseFloat(res), true);
} // endRequestStateAndSetOldAPI

// If started as allInOne/compact mode => return function to create instance
if (require.main === module) {
    // start the instance directly
    startAdapter();
} else {
    module.exports = startAdapter;
} // endElse
