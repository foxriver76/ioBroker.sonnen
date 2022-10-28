import * as utils from '@iobroker/adapter-core';
import { generalAPIStates, oldAPIStates, getPowermeterStates, apiStatesV2, apiStatesV1 } from './lib/utils';
import requestPromise, { RequestPromiseOptions } from 'request-promise-native';

type ApiVersion = 'old' | 'v1' | 'v2' | 'legacy';
type OnlineStatus = 'true' | 'false';

interface LatestData {
    Consumption_W: number;
    FullChargeCapacity: number;
    GridFeedIn_W: number;
    Pac_total_W: number;
    Production_W: number;
    RSOC: number;
    SetPoint_W: number;
    Timestamp: string;
    USOC: number;
    UTC_Offet: number;
    ic_status: {
        'DC Shutdown Reason': {
            'Critical BMS Alarm': boolean;
            'Electrolyte Leakage': boolean;
            'Error condition in BMS initialization': boolean;
            HW_Shutdown: boolean;
            'HardWire Over Voltage': boolean;
            'HardWired Dry Signal A': boolean;
            'HardWired Under Voltage': boolean;
            'Holding Circuit Error': boolean;
            'Initialization Timeout': boolean;
            'Initialization of AC contactor failed': boolean;
            'Initialization of BMS hardware failed': boolean;
            'Initialization of DC contactor failed': boolean;
            'Initialization of Inverter failed': boolean;
            'Invalid or no SystemType was set': boolean;
            'Inverter Over Temperature': boolean;
            'Inverter Under Voltage': boolean;
            'Inverter Unknown Error': boolean;
            'Inverter Version Too Low For Dc-Module': boolean;
            'Manual shutdown by user': boolean;
            'Minimum rSOC of System reached': boolean;
            'Modules voltage out of range': boolean;
            'No Setpoint received by HC': boolean;
            'Odd number of battery modules': boolean;
            'One single module detected and module voltage is out of range': boolean;
            'Only one single module detected': boolean;
            'Shutdown Timer started': boolean;
            'System Validation failed': boolean;
            'Voltage Monitor Changed': boolean;
        };
        'Eclipse Led': {
            'Blinking Red': boolean;
            'Pulsing Green': boolean;
            'Pulsing Orange': boolean;
            'Pulsing White': boolean;
            'Solid Red': boolean;
        };
        'MISC Status Bits': {
            'Discharge not allowed': boolean;
            'F1 open': boolean;
            'Grid-Disconnection requested from HC': boolean;
            'Min System SOC': boolean;
            'Min User SOC': boolean;
            'Setpoint Timeout': boolean;
        };
        'Microgrid Status': {
            'Continious Power Violation': boolean;
            'Discharge Current Limit Violation': boolean;
            'Low Temperature': boolean;
            'Max System SOC': boolean;
            'Max User SOC': boolean;
            'Microgrid Enabled': boolean;
            'Min System SOC': boolean;
            'Min User SOC': boolean;
            'Over Charge Current': boolean;
            'Over Discharge Current': boolean;
            'Peak Power Violation': boolean;
            'Protect is activated': boolean;
            'Transition to Ongrid Pending': boolean;
        };
        'Setpoint Priority': {
            BMS: boolean;
            'Energy Manager': boolean;
            'Full Charge Request': boolean;
            Inverter: boolean;
            'Min User SOC': boolean;
            'Trickle Charge': boolean;
        };
        'System Validation': {
            'Country Code Set status flag 1': boolean;
            'Country Code Set status flag 2': boolean;
            'Self test Error DC Wiring': boolean;
            'Self test Postponed': boolean;
            'Self test Precondition not met': boolean;
            'Self test Running': boolean;
            'Self test successful finished': boolean;
        };
        nrbatterymodules: number;
        secondssincefullcharge: number;
        statebms: string;
        statecorecontrolmodule: string;
        stateinverter: string;
        timestamp: string;
    };
}

interface PowerMeterEntry {
    a_l1: number;
    a_l2: number;
    a_l3: number;
    channel: number;
    deviceid: number;
    direction: 'production' | 'consumption';
    error: number;
    kwh_exported: number;
    kwh_imported: number;
    v_l1_l2: number;
    v_l1_n: number;
    v_l2_l3: number;
    v_l2_n: number;
    v_l3_l1: number;
    v_l3_n: number;
    va_total: number;
    var_total: number;
    w_l1: number;
    w_l2: number;
    w_l3: number;
    w_total: number;
}

interface StatusData {
    SystemStatus: string;
    FlowConsumptionProduction: number;
    FlowProductionGrid: number;
    FlowProductionBattery: number;
    FlowGridBattery: number;
    FlowConsumptionGrid: number;
    FlowConsumptionBattery: number;
    GridFeedIn_W: number;
    IsSystemInstalled: number;
    Consumption_W: number;
    BatteryCharging: boolean;
    Production_W: number;
    Pac_total_W: number;
    /** relative state of charge */
    RSOC: number;
    /** user state of charge */
    USOC: number;
    Fac: number;
    Uac: number;
    Ubat: number;
    Timestamp: string;
    ReturnCode: number;
}

const ENDPOINTS_CONFIG_V2 = [
    'CM_MarketingModuleCapacity',
    'DE_Software',
    'EM_OperatingMode',
    'EM_ToU_Schedule',
    'EM_USOC',
    'EM_US_CHP_Max_SOC',
    'EM_US_CHP_Min_SOC',
    'EM_US_GENRATOR_TYPE',
    'EM_US_GEN_POWER_SET_POINT',
    'EM_US_RE_ENABLE_MICROGRID',
    'EM_US_USER_INPUT_TIME_ONE',
    'EM_US_USER_INPUT_TIME_THREE',
    'EM_US_USER_INPUT_TIME_TWO',
    'IC_BatteryModules',
    'IC_InverterMaxPower_w',
    'NVM_PfcFixedCosPhi',
    'NVM_PfcIsFixedCosPhiActive',
    'NVM_PfcIsFixedCosPhiLagging'
] as const;

interface LegacyResponse {
    devices: Record<string, LegacyDevice>;
}

interface LegacyDevice {
    id: number;
    parent: number;
    [other: string]: any;
}

let polling: NodeJS.Timeout;
let ip: string;
let adapter: ioBroker.Adapter;
let pollingTime: number;
let apiVersion: ApiVersion;
let restartTimer: NodeJS.Timeout;
let powermeterCreated = false;
const requestOptions: RequestPromiseOptions = { headers: {} };
let inverterEndpoint = false;

function startAdapter(options: Partial<utils.AdapterOptions> = {}) {
    adapter = new utils.Adapter({ ...options, name: 'sonnen' });

    adapter.on(`unload`, async callback => {
        try {
            clearTimeout(polling);
            if (restartTimer) {
                clearTimeout(restartTimer);
            }
            adapter.log.info(`[END] Stopping sonnen adapter...`);
            await adapter.setStateAsync(`info.connection`, false, true);
            callback();
        } catch {
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
                requestOptions.headers!['Auth-Token'] = adapter.config.token;
                try {
                    const data = await requestPromise({ url: `http://${ip}/api/v2/latestdata`, ...requestOptions });
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const latestData: LatestData = JSON.parse(data);
                    apiVersion = 'v2';
                    adapter.log.debug('[START] Check ok, using official API');
                    return void main();
                } catch (e: any) {
                    adapter.log.error(`Auth-Token provided, but could not use official API: ${e.message}`);
                }
            }

            try {
                await requestPromise({ url: `http://${ip}:8080/api/v1/status`, timeout: 2000 });
                adapter.log.debug(`[START] 8080 API detected`);
                apiVersion = 'v1';
                return void main();
            } catch (e: any) {
                adapter.log.debug(`[START] It's not 8080, because ${e.message}`);
            }

            try {
                // test if both works, else use legacy, because of incomplete implementation of API
                await requestPromise(`http://${ip}:7979/rest/devices/battery/M03`);
                await requestPromise(`http://${ip}:7979/rest/devices/battery/M034`);
                apiVersion = `old`;
                adapter.log.debug(`[START] 7979 API detected`);
                return void main();
            } catch (e: any) {
                adapter.log.debug(`[START] It's not 7979, because ${e.message}`);
            }

            try {
                await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
                apiVersion = 'legacy';
                return void main();
            } catch (e: any) {
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
        const stateVal = state.val;

        adapter.log.debug(`[COMMAND] State Change - ID: ${id}; State: ${stateVal}`);

        if (id === `control.charge`) {
            try {
                if (apiVersion === 'v2') {
                    await requestPromise.post({
                        url: `http://${ip}/api/v2/setpoint/charge/${stateVal}`,
                        ...requestOptions
                    });
                } else {
                    await requestPromise.put({ url: `http://${ip}:8080/api/v1/setpoint/charge/${stateVal}` });
                }
                adapter.setState(`control.charge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${stateVal} to charge`);
            } catch (e: any) {
                adapter.log.warn(`Error changing charge: ${e.message}`);
            }
        } else if (id === `control.discharge`) {
            try {
                if (apiVersion === 'v2') {
                    await requestPromise.post({
                        url: `http://${ip}/api/v2/setpoint/discharge/${stateVal}`,
                        ...requestOptions
                    });
                } else {
                    await requestPromise.put({ url: `http://${ip}:8080/api/v1/setpoint/discharge/${stateVal}` });
                }
                adapter.setState(`control.discharge`, state, true);
                adapter.log.debug(`[PUT] ==> Sent ${stateVal} to discharge`);
            } catch (e: any) {
                adapter.log.warn(`Error changing discharge: ${e.message}`);
            }
        } else if (id.startsWith('configurations.')) {
            const command = id.split('.')[1];
            const data: Record<string, string> = {};
            const val = typeof stateVal === 'number' ? stateVal.toString() : stateVal;
            data[command] = val as string;
            adapter.log.debug(`[PUT] ==> Sent ${JSON.stringify(data)} to configurations`);
            try {
                await requestPromise.put({ url: `http://${ip}/api/v2/configurations`, ...requestOptions, json: data });
            } catch (e: any) {
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
    for (const obj of generalAPIStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
    }
    const specificStates = apiVersion === 'v2' ? apiStatesV2 : apiStatesV1;

    for (const obj of specificStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
    }

    if (apiVersion === 'v2') {
        // cleanup old states
        for (const obj of apiStatesV1) {
            promises.push(adapter.delObjectAsync(obj._id));
        }
    }

    if (adapter.config.pollOnlineStatus) {
        promises.push(
            adapter.extendObjectAsync('status.onlineStatus', {
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
            })
        );
    } else {
        // make sure to delete the object
        promises.push(adapter.delObjectAsync('status.onlineStatus'));
    }

    await Promise.all(promises);

    try {
        const data = await requestPromise(statusUrl); // poll states on start
        const state = await adapter.getStateAsync(`info.connection`);
        if (!state || !state.val) {
            adapter.setState(`info.connection`, true, true);
            adapter.log.debug(`[CONNECT] Connection successfuly established`);
        }
        adapter.log.debug(`[DATA] <== ${data}`);
        setBatteryStates(JSON.parse(data));
    } catch (e: any) {
        adapter.log.warn(`[REQUEST] <== ${e.message}`);
        adapter.setState(`info.connection`, false, true);
        adapter.log.warn(`[CONNECT] Connection failed`);
    }

    try {
        await requestSettings();
    } catch (e: any) {
        adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
    }

    try {
        await requestPowermeterEndpoint();
        if (adapter.config.pollOnlineStatus) {
            await requestOnlineStatus();
        }
        await requestIosEndpoint();
        await requestInverterEndpoint();
    } catch (e: any) {
        adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
    }

    const pollStates = async () => {
        // poll states every [30] seconds
        try {
            const data = await requestPromise(statusUrl);
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            }
            setBatteryStates(JSON.parse(data));
            try {
                await requestPowermeterEndpoint();
                if (adapter.config.pollOnlineStatus) {
                    await requestOnlineStatus();
                }
                await requestIosEndpoint();
                await requestInverterEndpoint();
            } catch (e: any) {
                adapter.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
            }

            try {
                await requestSettings();
            } catch (e: any) {
                adapter.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
            }
        } catch (e: any) {
            adapter.log.warn(`[REQUEST] <== ${e.message}`);
            adapter.setState(`info.connection`, false, true);
            adapter.log.warn(`[CONNECT] Connection failed`);
        }

        polling = setTimeout(pollStates, pollingTime);
    };

    pollStates();
}

/*
 * Internals
 */
async function oldAPImain(): Promise<void> {
    // create objects
    let promises = [];
    for (const obj of oldAPIStates) {
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
        const lastSync = new Date();
        adapter.setState(
            `info.lastSync`,
            new Date(lastSync.getTime() - lastSync.getTimezoneOffset() * 60000).toISOString(),
            true
        );
        const state = await adapter.getStateAsync(`info.connection`);
        if (!state?.val) {
            adapter.setState(`info.connection`, true, true);
        }
    } catch (e: any) {
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
            const lastSync = new Date();
            adapter.setState(
                `info.lastSync`,
                new Date(lastSync.getTime() - lastSync.getTimezoneOffset() * 60000).toISOString(),
                true
            );

            adapter.setStateChanged(`info.connection`, true, true);
        } catch (e: any) {
            await adapter.setStateChangedAsync(`info.connection`, false, true);
            adapter.log.warn(`[DATA] Error getting Data ${e.message}`);
        }

        polling = setTimeout(pollStates, pollingTime);
    };

    pollStates();
}

async function legacyAPImain() {
    // here we store the id of the battery
    let batteryId: number | undefined;
    try {
        const res = await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
        const data: LegacyResponse = JSON.parse(res);

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
    } catch (e: any) {
        adapter.log.error(`Could not get initial data - restarting adapter: ${e.message}`);
        return void adapter.restart();
    }

    const pollStates = async () => {
        try {
            const res = await requestPromise(`http://${ip}:3480/data_request?id=sdata&output_format=json`);
            const data: LegacyResponse = JSON.parse(res);

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
            adapter.setState(
                `info.lastSync`,
                new Date(lastSync.getTime() - lastSync.getTimezoneOffset() * 60000).toISOString(),
                true
            );

            // update the info connection state
            const state = await adapter.getStateAsync(`info.connection`);
            if (!state || !state.val) {
                adapter.setState(`info.connection`, true, true);
                adapter.log.debug(`[CONNECT] Connection successfuly established`);
            }
        } catch (e: any) {
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
function convertLegacyState(stateVal: string): number | boolean | string {
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
    const data = await requestPromise(`http://${ip}:8080/api/configuration`);
    adapter.log.debug(`[SETTINGS] Configuration received: ${data}`);
    await adapter.setStateAsync(`info.configuration`, data, true);
}

async function requestIosEndpoint() {
    try {
        let data = await requestPromise(`http://${ip}:8080/api/ios`);
        const promises = [];

        promises.push(adapter.setStateAsync(`info.ios`, data, true));

        adapter.log.debug(`io json: ${data}`);

        data = JSON.parse(data);

        const relevantIOs = ['DO_12', 'DO_13', 'DO_14'];

        for (const io of relevantIOs) {
            promises.push(adapter.setStateAsync(`ios.${io}`, !!data[io].status, true));
        }

        await Promise.all(promises);
    } catch (e: any) {
        throw new Error(`Could not request ios endpoint: ${e.message}`);
    }
} // requestIosEndpoint

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
    } catch (e: any) {
        if (inverterEndpoint) {
            throw new Error(`Could not request inverter endpoint: ${e.message}`);
        } else {
            // not all batteries seem to have this endpoint so don't throw an error if it was never there, see Issue #55
            adapter.log.debug(`Could not request inverter endpoint: ${e.message}`);
        }
    }
}

/**
 * request online status of the battery
 */
async function requestOnlineStatus(): Promise<void> {
    try {
        const data: OnlineStatus = await requestPromise(`http://${ip}/api/online_status`);

        if (data !== 'true' && data !== 'false') {
            throw new Error(`Expected string with "true" or "false" as onlineStatus, got "${data as any}"`);
        }

        await adapter.setStateAsync(`status.onlineStatus`, data === 'true', true);
    } catch (e: any) {
        throw new Error(`Could not request online status: ${e.message}`);
    }
}

async function requestPowermeterEndpoint() {
    try {
        const powermeterUrl =
            apiVersion === 'v2' ? `http://${ip}/api/v2/powermeter` : `http://${ip}:8080/api/powermeter`;
        const data = await requestPromise({ url: powermeterUrl, ...requestOptions });

        adapter.log.debug(`Powermeter: ${data}`);
        const promises = [];
        promises.push(adapter.setStateAsync(`info.powerMeter`, data, true));
        const powerMeterData: PowerMeterEntry[] = JSON.parse(data);

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
        ] as const;

        // we have multiple powermeters
        for (const pm in powerMeterData) {
            for (const state of relevantStates) {
                if (!powermeterCreated) {
                    const objs = getPowermeterStates(pm, powerMeterData[pm].direction);
                    for (const obj of objs) {
                        const id = obj._id;
                        await adapter.extendObjectAsync(id, obj);
                    }
                }

                promises.push(adapter.setStateAsync(`powermeter.${pm}.${state}`, powerMeterData[pm][state], true));
            }
        }

        // all powermeters created
        powermeterCreated = true;

        await Promise.all(promises);
    } catch (e: any) {
        throw new Error(`Could not request powermeter endpoint: ${e.message}`);
    }
}

function setBatteryStates(json: StatusData) {
    if (json.ReturnCode) {
        adapter.log.warn(`[DATA] <== Return Code ${json.ReturnCode}`);
        return;
    }
    const lastSync = new Date();
    adapter.setState(
        `info.lastSync`,
        new Date(lastSync.getTime() - lastSync.getTimezoneOffset() * 60000).toISOString(),
        true
    );
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
    adapter.setState(
        `status.systemTime`,
        new Date(systemTime.getTime() - systemTime.getTimezoneOffset() * 60000).toISOString(),
        true
    );
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
    adapter.setState('status.systemStatus', json.SystemStatus, true);
}

async function requestStateAndSetOldAPI(code: string, stateId: string): Promise<void> {
    let res = await requestPromise(`http://${ip}:7979/rest/devices/battery/${code}`);
    res = res.trim();
    adapter.log.debug(`[DATA] Received ${res} for ${code} and set it to ${stateId}`);
    adapter.setState(stateId, parseFloat(res), true);
}

/**
 * Requests settings for V2 endpoint
 */
async function requestSettingsV2(): Promise<void> {
    for (const id of ENDPOINTS_CONFIG_V2) {
        const data = await requestPromise({ url: `http://${ip}/api/v2/configurations/${id}`, ...requestOptions });
        adapter.log.debug(`Configuration for "${id}" received: ${data}`);
        let value = JSON.parse(data)[id];

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
} else {
    module.exports = startAdapter;
}
