/**
 * sonnen adapter
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils = require(`@iobroker/adapter-core`); // Get common adapter utils
const helper = require(`${__dirname}/lib/utils`);
const request = require(`request`);
const requestPromise = require(`request-promise-native`);
let polling;
let ip;
let adapter;
let pollingTime;
let apiVersion;
let restartTimer;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: `sonnen`
    });

    adapter = new utils.Adapter(options);

    adapter.on(`unload`, callback => {
        try {
            clearInterval(polling);
            if (restartTimer) {
                clearTimeout(restartTimer);
            }
            adapter.log.info(`[END] Stopping sonnen adapter...`);
            adapter.setState(`info.connection`, false, true);
            callback();
        } catch (e) {
            callback();
        }
    });

    adapter.on(`ready`, () => {
        if (adapter.config.ip) {
            ip = adapter.config.ip;
            adapter.log.info(`[START] Starting sonnen adapter`);
            adapter.log.debug(`[START] Check API`);
            requestPromise({url: `http://${ip}:8080/api/v1/status`, timeout: 2000}).then(() => {
                adapter.log.debug(`[START] 8080 API detected`);
                apiVersion = `new`;
                main();
            }).catch(e => {
                adapter.log.debug(`[START] It's not 8080, because ${e}`);
                requestPromise(`http://${ip}:7979/rest/devices/battery/M03`).then(() => {
                    apiVersion = `old`;
                    adapter.log.debug(`[START] 7979 API detected`);
                    main();
                }).catch(e => {
                    adapter.log.warn(`[START] Could not get API version... restarting in 30 seconds: ${e}`);
                    restartTimer = setTimeout(restartAdapter, 30000);
                });
            });
        } else {
            adapter.log.warn(`[START] No IP-address set`);
        }
    });

    adapter.on(`stateChange`, (id, state) => {
        if (!id || !state || state.ack) {
            return;
        } // Ignore acknowledged state changes or error states
        id = id.substring(adapter.namespace.length + 1); // remove instance name and id
        state = state.val;

        adapter.log.debug(`[COMMAND] State Change - ID: ${id}; State: ${state}`);

        if (id === `control.charge`) {
            request.put(`http://${ip}:8080/api/v1/setpoint/charge/${state}`, (error, response) => {
                if (response && response.statusCode.toString() === `200`) {
                    adapter.setState(`control.charge`, state, true);
                    adapter.log.debug(`[PUT] ==> Sent ${state} to charge`);
                } else {
                    adapter.log.warn(`[PUT] Error ${error}`);
                }
            });
        } else if (id === `control.discharge`) {
            request.put(`http://${ip}:8080/api/v1/setpoint/discharge/${state}`, (error, response) => {
                if (response && response.statusCode.toString() === `200`) {
                    adapter.setState(`control.discharge`, state, true);
                    adapter.log.debug(`[PUT] ==> Sent ${state} to discharge`);
                } else {
                    adapter.log.warn(`[PUT] Error ${error}`);
                }
            });
        } // endElseIf
    });

    return adapter;
} // endStartAdapter

async function main() {
    pollingTime = adapter.config.pollInterval || 7000;
    adapter.log.debug(`[INFO] Configured polling interval: ${pollingTime}`);
    // all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates(`*`);

    adapter.getForeignObject(adapter.namespace, (err, obj) => { // create device namespace
        if (!obj) {
            adapter.setForeignObject(adapter.namespace, {
                type: `device`,
                common: {
                    name: `sonnen device`
                }
            });
        } // endIf
    });

    adapter.log.debug(`[START] Started Adapter with: ${ip}`);

    if (apiVersion === `old`) {
        return oldAPImain();
    }

    const statusUrl = `http://${ip}:8080/api/v1/status`; // Status Path - api/status --> GET

    // create objects
    const promises = [];
    for (const obj of helper.newAPIStates) {
        const id = obj._id;
        delete obj._id;
        promises.push(adapter.setObjectNotExistsAsync(id, obj));
    }

    await Promise.all(promises);

    request(statusUrl, (error, response, body) => { // poll states on start
        if (error) {
            adapter.log.warn(`[REQUEST] <== ${error}`);
        }
        if (response && response.statusCode.toString() === `200`) {
            adapter.getState(`info.connection`, (err, state) => {
                if (!state || !state.val) {
                    adapter.setState(`info.connection`, true, true);
                    adapter.log.debug(`[CONNECT] Connection successful established`);
                } // endIf
            });
            adapter.log.debug(`[DATA] <== ${body}`);
            setBatteryStates(JSON.parse(body));
        } else {
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }// endElse
    });

    requestSettings().catch(e => {
        adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e}`);
    });

    try {
        await requestInverterEndpoint();
        await requestPowermeterEndpoint();
        await requestOnlineStatus();
    } catch (e) {
        adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e}`);
    }

    if (!polling) {
        polling = setInterval(() => { // poll states every [30] seconds
            request(statusUrl, async (error, response, body) => {
                if (error) {
                    adapter.log.warn(`[REQUEST] <== ${error}`);
                }
                if (response && response.statusCode.toString() === `200`) {
                    adapter.getState(`info.connection`, (err, state) => {
                        if (!state || !state.val) {
                            adapter.setState(`info.connection`, true, true);
                            adapter.log.debug(`[CONNECT] Connection successful established`);
                        } // endIf
                    });
                    setBatteryStates(JSON.parse(body));
                    try {
                        await requestInverterEndpoint();
                        await requestPowermeterEndpoint();
                        await requestOnlineStatus();
                    } catch (e) {
                        adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e}`);
                    }
                } else {
                    adapter.setState(`info.connection`, false, true);
                    adapter.log.warn(`[CONNECT] Connection failed`);
                } // endElse
            });
        }, pollingTime);
    } // endIf
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
        promises.push(adapter.setObjectNotExistsAsync(id, obj));
    }

    await Promise.all(promises);
    promises = [];
    promises.push(requestStateAndSetOldAPI(`M03`, `status.production`));
    promises.push(requestStateAndSetOldAPI(`M04`, `status.consumption`));
    promises.push(requestStateAndSetOldAPI(`M05`, `status.relativeSoc`));
    promises.push(requestStateAndSetOldAPI(`M06`, `status.operatingMode`));
    promises.push(requestStateAndSetOldAPI(`M34`, `status.pacDischarge`));
    promises.push(requestStateAndSetOldAPI(`M35`, `status.pacCharge`));
    promises.push(requestStateAndSetOldAPI(`M07`, `status.consumptionL1`));
    promises.push(requestStateAndSetOldAPI(`M08`, `status.consumptionL2`));
    promises.push(requestStateAndSetOldAPI(`M09`, `status.consumptionL3`));

    Promise.all(promises).then(() => {
        const lastSync = new Date();
        adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);
        adapter.getStateAsync(`info.connection`).then(state => {
            if (!state.val) {
                adapter.setState(`info.connection`, true, true);
            }
        }).catch(() => {
            adapter.setState(`info.connection`, true, true);
        });
    }).catch(e => {
        adapter.log.warn(`[DATA] Error getting Data ${e}`);
    });

    if (!polling) {
        polling = setInterval(() => { // poll states every configured seconds
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

            Promise.all(promises).then(() => {
                const lastSync = new Date();
                adapter.setState(`info.lastSync`, new Date(lastSync - lastSync.getTimezoneOffset() * 60000).toISOString(), true);
                adapter.getStateAsync(`info.connection`).then(state => {
                    if (!state.val) {
                        adapter.setState(`info.connection`, true, true);
                    }
                });
            }).catch(e => {
                adapter.getStateAsync(`info.connection`).then(state => {
                    if (state.val === true) {
                        adapter.setState(`info.connection`, false, true);
                    }
                    adapter.log.warn(`[DATA] Error getting Data ${e}`);
                });
            });
        }, pollingTime);
    } //
} // endOldAPImain

function requestSettings() {
    return new Promise((resolve, reject) => {
        requestPromise(`http://${ip}:8080/api/configuration`).then(data => {
            adapter.log.debug(`[SETTINGS] Configuration received: ${data}`);
            adapter.setStateAsync(`info.configuration`, data, true).then(resolve);
        }).catch(e => {
            reject(e);
        });
    });
} // endRequestSettings

async function requestInverterEndpoint() {
    try {
        const data = await requestPromise(`http://${ip}:8080/api/inverter`);
        await adapter.setStateAsync(`info.inverter`, data, true);
        return Promise.resolve();
    } catch(e) {
        return Promise.reject(e);
    }
} // endRequestInverterEndpoint

async function requestOnlineStatus() {
    try {
        let data = await requestPromise(`http://${ip}/api/online_status`);
        if (data === `true`) {
            data = true;
        } else if (data === `false`) {
            data = false;
        } else {
            return Promise.reject(new Error(`Expected string with "true" or "false" as onlineStatus, got "${data}"`));
        }

        await adapter.setStateAsync(`status.onlineStatus`, data, true);
        return Promise.resolve();
    } catch (e) {
        return Promise.reject(e);
    }
}

async function requestPowermeterEndpoint() {
    try {
        const data = await requestPromise(`http://${ip}:8080/api/powermeter`);
        await adapter.setStateAsync(`info.powerMeter`, data, true);
        return Promise.resolve();
    } catch(e) {
        return Promise.reject(e);
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

function restartAdapter() {
    adapter.getForeignObjectAsync(`system.adapter.${adapter.namespace}`).then(obj => {
        if (obj) {
            adapter.setForeignObject(`system.adapter.${adapter.namespace}`, obj);
        }
    });
} // endFunctionRestartAdapter

function requestStateAndSetOldAPI(code, state) {
    return new Promise((resolve, reject) => {
        requestPromise(`http://${ip}:7979/rest/devices/battery/${code}`).then(res => {
            res = res.trim();
            adapter.log.debug(`[DATA] Received ${res} for ${code} and set it to ${state}`);
            adapter.setState(state, parseFloat(res), true);
            resolve();
        }).catch(e => {
            reject(e);
        });
    });
} // endRequestStateAndSetOldAPI

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
} // endElse