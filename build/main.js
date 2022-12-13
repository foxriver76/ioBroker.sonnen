"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const utils_1 = require("./lib/utils");
const request_promise_native_1 = __importDefault(require("request-promise-native"));
let polling;
let ip;
let adapter;
let pollingTime;
let apiVersion;
let restartTimer;
let powermeterCreated = false;
const requestOptions = { headers: {} };
let inverterEndpoint = false;
function startAdapter(options = {}) {
    adapter = new utils.Adapter({ ...options, name: 'sonnen' });
    adapter.on(`unload`, async (callback) => {
        try {
            clearTimeout(polling);
            if (restartTimer) {
                clearTimeout(restartTimer);
            }
            adapter.log.info(`[END] Stopping sonnen adapter...`);
            await adapter.setStateAsync(`info.connection`, false, true);
            callback();
        }
        catch (_a) {
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
                    await (0, request_promise_native_1.default)({ url: `http://${ip}/api/v2/latestdata`, ...requestOptions });
                    apiVersion = 'v2';
                    adapter.log.debug('[START] Check ok, using official API');
                    return void main();
                }
                catch (e) {
                    adapter.log.error(`Auth-Token provided, but could not use official API: ${e.message}`);
                }
            }
            try {
                await (0, request_promise_native_1.default)({ url: `http://${ip}:8080/api/v1/status`, timeout: 2000 });
                adapter.log.debug(`[START] 8080 API detected`);
                apiVersion = 'v1';
                return void main();
            }
            catch (e) {
                adapter.log.debug(`[START] It's not 8080, because ${e.message}`);
            }
            try {
                // test if both works, else use legacy, because of incomplete implementation of API
                await (0, request_promise_native_1.default)(`http://${ip}:7979/rest/devices/battery/M03`);
                await (0, request_promise_native_1.default)(`http://${ip}:7979/rest/devices/battery/M034`);
                apiVersion = `old`;
                adapter.log.debug(`[START] 7979 API detected`);
                return void main();
            }
            catch (e) {
                adapter.log.debug(`[START] It's not 7979, because ${e.message}`);
            }
            try {
                await (0, request_promise_native_1.default)(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
                apiVersion = 'legacy';
                return void main();
            }
            catch (e) {
                adapter.log.warn(`[START] Could not get API version... restarting in 30 seconds: ${e.message}`);
                restartTimer = setTimeout(adapter.restart, 30000);
            }
        }
        else {
            adapter.log.warn(`[START] No IP-address set`);
        }
    });
    adapter.on(`stateChange`, async (id, state) => {
        if (!id || !state || state.ack) {
            return;
        } // Ignore acknowledged state changes or error states
        id = id.substring(adapter.namespace.length + 1); // remove instance name and id
        const stateVal = state.val;
        adapter.log.debug(`[COMMAND] State Change - ID: ${id}; State: ${stateVal}`);
        if (id === `control.charge`) {
            try {
                if (apiVersion === 'v2') {
                    await request_promise_native_1.default.post({
                        url: `http://${ip}/api/v2/setpoint/charge/${stateVal}`,
                        ...requestOptions
                    });
                }
                else {
                    await request_promise_native_1.default.put({ url: `http://${ip}:8080/api/v1/setpoint/charge/${stateVal}` });
                }
                adapter.setState(`control.charge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${stateVal} to charge`);
            }
            catch (e) {
                adapter.log.warn(`Error changing charge: ${e.message}`);
            }
        }
        else if (id === `control.discharge`) {
            try {
                if (apiVersion === 'v2') {
                    await request_promise_native_1.default.post({
                        url: `http://${ip}/api/v2/setpoint/discharge/${stateVal}`,
                        ...requestOptions
                    });
                }
                else {
                    await request_promise_native_1.default.put({ url: `http://${ip}:8080/api/v1/setpoint/discharge/${stateVal}` });
                }
                adapter.setState(`control.discharge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${stateVal} to discharge`);
            }
            catch (e) {
                adapter.log.warn(`Error changing discharge: ${e.message}`);
            }
        }
        else if (id.startsWith('configurations.')) {
            const command = id.split('.')[1];
            const data = {};
            const val = typeof stateVal === 'number' ? stateVal.toString() : stateVal;
            data[command] = val;
            adapter.log.debug(`[PUT] ==> Sent ${JSON.stringify(data)} to configurations`);
            try {
                await request_promise_native_1.default.put({ url: `http://${ip}/api/v2/configurations`, ...requestOptions, json: data });
            }
            catch (e) {
                adapter.log.error(`Could not change configuration "${command}": ${e.message}`);
            }
        }
    });
    return adapter;
}
async function main() {
    pollingTime = adapter.config.pollInterval || 7000;
    adapter.log.debug(`[INFO] Configured polling interval: ${pollingTime}`);
    // all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates(`*`);
    // create device namespace
    await adapter.setForeignObjectNotExistsAsync(adapter.namespace, {
        // @ts-expect-error issue already opened it is allowed
        type: 'device',
        // @ts-expect-error issue already opened it is allowed
        common: {
            name: 'sonnen device'
        }
    });
    adapter.log.debug(`[START] Started Adapter with: ${ip}`);
    if (apiVersion === 'old') {
        return void oldAPImain();
    }
    if (apiVersion === 'legacy') {
        return void legacyAPImain();
    }
    const statusUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/status` : `http://${ip}:8080/api/v1/status`;
    // create objects
    const promises = [];
    for (const obj of utils_1.generalAPIStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
    }
    const specificStates = apiVersion === 'v2' ? utils_1.apiStatesV2 : utils_1.apiStatesV1;
    if (apiVersion === 'v2') {
        // cleanup old states
        for (const obj of utils_1.apiStatesV1) {
            promises.push(adapter.delObjectAsync(obj._id));
        }
    }
    for (const obj of specificStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
    }
    if (adapter.config.pollOnlineStatus) {
        promises.push(adapter.extendObjectAsync('status.onlineStatus', {
            _id: 'status.onlineStatus',
            type: `state`,
            common: {
                name: `Battery Online Status`,
                type: `boolean`,
                role: `indicator`,
                read: true,
                write: false,
                desc: `Online status of your sonnen battery`
            },
            native: {}
        }));
    }
    else {
        // make sure to delete the object
        promises.push(adapter.delObjectAsync('status.onlineStatus'));
    }
    await Promise.all(promises);
    const pollStates = async () => {
        // poll states every [30] seconds
        try {
            const data = await (0, request_promise_native_1.default)(statusUrl);
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            }
            await setBatteryStates(JSON.parse(data));
            try {
                await requestPowermeterEndpoint();
                if (adapter.config.pollOnlineStatus) {
                    await requestOnlineStatus();
                }
                await requestIosEndpoint();
                await requestInverterEndpoint();
            }
            catch (e) {
                adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
            }
            try {
                await requestSettings();
            }
            catch (e) {
                adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
            }
        }
        catch (e) {
            adapter.log.warn(`[REQUEST] <== ${e.message}`);
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }
        try {
            await requestLatestData();
        }
        catch (e) {
            adapter.log.warn(`[LATEST] Error receiving latest data: ${e.message}`);
        }
        polling = setTimeout(pollStates, pollingTime);
    };
    pollStates();
}
/*
 * Internals
 */
async function oldAPImain() {
    // create objects
    let promises = [];
    for (const obj of utils_1.oldAPIStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
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
        await adapter.setState(`info.lastSync`, Date.now(), true);
        const state = await adapter.getStateAsync(`info.connection`);
        if (!(state === null || state === void 0 ? void 0 : state.val)) {
            await adapter.setState(`info.connection`, true, true);
        }
    }
    catch (e) {
        adapter.log.warn(`[DATA] Error getting Data ${e.message}`);
    }
    const pollStates = async () => {
        // poll states every configured seconds
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
            adapter.setState(`info.lastSync`, Date.now(), true);
            adapter.setStateChanged(`info.connection`, true, true);
        }
        catch (e) {
            await adapter.setStateChangedAsync(`info.connection`, false, true);
            adapter.log.warn(`[DATA] Error getting Data ${e.message}`);
        }
        polling = setTimeout(pollStates, pollingTime);
    };
    pollStates();
}
async function legacyAPImain() {
    // here we store the id of the battery
    let batteryId;
    try {
        const res = await (0, request_promise_native_1.default)(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
        const data = JSON.parse(res);
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
                            // @ts-expect-error investigate later
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
                            // @ts-expect-error investigate later
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
    }
    catch (e) {
        adapter.log.error(`Could not get initial data - restarting adapter: ${e.message}`);
        return void adapter.restart();
    }
    const pollStates = async () => {
        try {
            const res = await (0, request_promise_native_1.default)(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
            const data = JSON.parse(res);
            for (const device of Object.values(data.devices)) {
                if (device.id === batteryId) {
                    for (const attr of Object.keys(device)) {
                        const stateVal = convertLegacyState(device[attr]);
                        await adapter.setStateAsync(`main.${attr}`, stateVal, true);
                    }
                }
                else if (device.parent === batteryId) {
                    for (const attr of Object.keys(device)) {
                        const stateVal = convertLegacyState(device[attr]);
                        await adapter.setStateAsync(`${device.id}.${attr}`, stateVal, true);
                    }
                }
            }
            // update the lastSync manually
            adapter.setState(`info.lastSync`, Date.now(), true);
            // update the info connection state
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            }
        }
        catch (e) {
            adapter.log.warn(`[REQUEST] <== ${e.message}`);
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }
        setTimeout(pollStates, pollingTime);
    };
    pollStates();
}
/**
 * Converts a state value to the correct type
 * @param stateVal - state value to convert
 */
function convertLegacyState(stateVal) {
    if (stateVal === 'TRUE') {
        return true;
    }
    if (stateVal === 'FALSE') {
        return false;
    }
    if (!isNaN(Number(stateVal))) {
        // it's a number
        return parseFloat(stateVal);
    }
    return stateVal;
}
async function requestSettings() {
    if (apiVersion === 'v2') {
        requestSettingsV2();
        return;
    }
    const data = await (0, request_promise_native_1.default)(`http://${ip}:8080/api/configuration`);
    adapter.log.debug(`[SETTINGS] Configuration received: ${data}`);
    await adapter.setStateAsync(`info.configuration`, data, true);
}
async function requestIosEndpoint() {
    try {
        const iosUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/io` : `http://${ip}:8080/api/ios`;
        const res = await (0, request_promise_native_1.default)({ url: iosUrl, ...requestOptions });
        const promises = [];
        promises.push(adapter.setStateAsync(`info.ios`, res, true));
        adapter.log.debug(`io json: ${res}`);
        const data = JSON.parse(res);
        const relevantIOs = ['DO_12', 'DO_13', 'DO_14'];
        for (const io of relevantIOs) {
            promises.push(adapter.setStateAsync(`ios.${io}`, !!data[io].status, true));
        }
        await Promise.all(promises);
    }
    catch (e) {
        // TODO: for now don't throw to not disturb users with current API
        adapter.log.debug(`Could not request ios endpoint: ${e.message}`);
        //throw new Error(`Could not request ios endpoint: ${e.message}`);
    }
}
async function requestInverterEndpoint() {
    try {
        const inverterUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/inverter` : `http://${ip}:8080/api/inverter`;
        const res = await (0, request_promise_native_1.default)({ url: inverterUrl, ...requestOptions });
        const promises = [];
        promises.push(adapter.setStateAsync(`info.inverter`, res, true));
        /** V1 has other response, handle it, v2 will only have the info state for now */
        if (apiVersion === 'v1') {
            const data = JSON.parse(res);
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
        }
        else if (apiVersion === 'v2') {
            const data = JSON.parse(res);
            promises.push(adapter.setStateAsync('inverter.pacTotal', data.pac_total, true));
            promises.push(adapter.setStateAsync('inverter.tmax', data.tmax, true));
            promises.push(adapter.setStateAsync('inverter.ubat', data.ubat, true));
        }
        await Promise.all(promises);
        // inverter endpoint exists
        inverterEndpoint = true;
    }
    catch (e) {
        if (inverterEndpoint) {
            throw new Error(`Could not request inverter endpoint: ${e.message}`);
        }
        else {
            // not all batteries seem to have this endpoint so don't throw an error if it was never there, see Issue #55
            adapter.log.debug(`Could not request inverter endpoint: ${e.message}`);
        }
    }
}
/**
 * request online status of the battery
 */
async function requestOnlineStatus() {
    try {
        const data = await (0, request_promise_native_1.default)(`http://${ip}/api/online_status`);
        if (data !== 'true' && data !== 'false') {
            throw new Error(`Expected string with "true" or "false" as onlineStatus, got "${data}"`);
        }
        await adapter.setStateAsync(`status.onlineStatus`, data === 'true', true);
    }
    catch (e) {
        throw new Error(`Could not request online status: ${e.message}`);
    }
}
/**
 * Requests the latest data endpoint and syncs states accordignly
 */
async function requestLatestData() {
    const latestDataUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/latestdata` : `http://${ip}:8080/api/latestdata`;
    const data = await (0, request_promise_native_1.default)({ url: latestDataUrl, ...requestOptions });
    adapter.log.debug(`Latest data: ${data}`);
    const latestData = JSON.parse(data);
    await adapter.setStateAsync('latestData.dcShutdownReason', decodeBitmapLikeObj(latestData.ic_status['DC Shutdown Reason'], 'Running'), true);
    await adapter.setStateAsync('latestData.eclipseLed', decodeBitmapLikeObj(latestData.ic_status['Eclipse Led'], 'Unknown'), true);
    await adapter.setStateAsync('latestData.secondsSinceFullCharge', latestData.ic_status.secondssincefullcharge, true);
}
/**
 * Decodes a bitmap like object to extract the key where the value is true
 *
 * @param bitmapLike The object to decode
 * @param fallback fallback to return if no value is true
 */
function decodeBitmapLikeObj(bitmapLike, fallback) {
    const foundEntry = Object.entries(bitmapLike).find(value => value[1]);
    return foundEntry ? foundEntry[0] : fallback;
}
async function requestPowermeterEndpoint() {
    try {
        const powermeterUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/powermeter` : `http://${ip}:8080/api/powermeter`;
        const data = await (0, request_promise_native_1.default)({ url: powermeterUrl, ...requestOptions });
        adapter.log.debug(`Powermeter: ${data}`);
        const promises = [];
        promises.push(adapter.setStateAsync(`info.powerMeter`, data, true));
        const powerMeterData = JSON.parse(data);
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
        for (const pm in powerMeterData) {
            if (!powermeterCreated) {
                const objs = (0, utils_1.getPowermeterStates)(pm, powerMeterData[pm].direction);
                for (const obj of objs) {
                    const id = obj._id;
                    await adapter.extendObjectAsync(id, obj);
                }
            }
            for (const state of relevantStates) {
                promises.push(adapter.setStateAsync(`powermeter.${pm}.${state}`, powerMeterData[pm][state], true));
            }
        }
        // all powermeters created
        powermeterCreated = true;
        await Promise.all(promises);
    }
    catch (e) {
        throw new Error(`Could not request powermeter endpoint: ${e.message}`);
    }
}
async function setBatteryStates(json) {
    if (json.ReturnCode) {
        adapter.log.warn(`[DATA] <== Return Code ${json.ReturnCode}`);
        return;
    }
    const promises = [];
    promises.push(adapter.setStateAsync(`info.lastSync`, Date.now(), true));
    promises.push(adapter.setStateAsync(`status.consumption`, json.Consumption_W, true));
    promises.push(adapter.setStateAsync(`status.batteryCharging`, json.BatteryCharging, true));
    promises.push(adapter.setStateAsync(`status.production`, json.Production_W, true));
    promises.push(adapter.setStateAsync(`status.pacTotal`, json.Pac_total_W, true));
    promises.push(adapter.setStateAsync(`status.relativeSoc`, json.RSOC, true));
    promises.push(adapter.setStateAsync(`status.userSoc`, json.USOC, true));
    promises.push(adapter.setStateAsync(`status.acFrequency`, json.Fac, true));
    promises.push(adapter.setStateAsync(`status.acVoltage`, json.Uac, true));
    promises.push(adapter.setStateAsync(`status.batteryVoltage`, json.Ubat, true));
    const systemTime = new Date(json.Timestamp);
    promises.push(adapter.setStateAsync(`status.systemTime`, systemTime.getTime(), true));
    if (json.IsSystemInstalled === 1) {
        promises.push(adapter.setStateAsync(`status.systemInstalled`, true, true));
    }
    else {
        promises.push(adapter.setStateAsync(`status.systemInstalled`, false, true));
    }
    promises.push(adapter.setStateAsync(`status.gridFeedIn`, json.GridFeedIn_W, true));
    promises.push(adapter.setStateAsync(`status.flowConsumptionBattery`, json.FlowConsumptionBattery, true));
    promises.push(adapter.setStateAsync(`status.flowConsumptionGrid`, json.FlowConsumptionGrid, true));
    promises.push(adapter.setStateAsync(`status.flowConsumptionProduction`, json.FlowConsumptionProduction, true));
    promises.push(adapter.setStateAsync(`status.flowGridBattery`, json.FlowGridBattery, true));
    promises.push(adapter.setStateAsync(`status.flowProductionBattery`, json.FlowProductionBattery, true));
    promises.push(adapter.setStateAsync(`status.flowProductionGrid`, json.FlowProductionGrid, true));
    promises.push(adapter.setStateAsync('status.systemStatus', json.SystemStatus, true));
    promises.push(adapter.setStateAsync('status.operatingMode', parseInt(json.OperatingMode), true));
    await Promise.all(promises);
}
async function requestStateAndSetOldAPI(code, stateId) {
    let res = await (0, request_promise_native_1.default)(`http://${ip}:7979/rest/devices/battery/${code}`);
    res = res.trim();
    adapter.log.debug(`[DATA] Received ${res} for ${code} and set it to ${stateId}`);
    adapter.setState(stateId, parseFloat(res), true);
}
/**
 * Requests settings for V2 endpoint
 */
async function requestSettingsV2() {
    const res = await (0, request_promise_native_1.default)({ url: `http://${ip}/api/v2/configurations`, ...requestOptions });
    adapter.log.debug(`Configuration received: ${res}`);
    const data = JSON.parse(res);
    for (const [id, val] of Object.entries(data)) {
        let value = val;
        if (value && !isNaN(Number(value))) {
            value = parseFloat(value);
        }
        await adapter.setState(`configurations.${id}`, value, true);
    }
}
// If started as allInOne/compact mode => return function to create instance
if (require.main === module) {
    // start the instance directly
    startAdapter();
}
else {
    module.exports = startAdapter;
}
//# sourceMappingURL=main.js.map