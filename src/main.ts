import * as utils from '@iobroker/adapter-core';
import { generalAPIStates, oldAPIStates, getPowermeterStates, apiStatesV2, apiStatesV1 } from './lib/utils';
import requestPromise, { RequestPromiseOptions } from 'request-promise-native';

type ApiVersion = 'old' | 'v1' | 'v2' | 'legacy';
type OnlineStatus = 'true' | 'false';

interface IoResponseValue {
    connector: string;
    status: 0 | 1;
    usage: string;
}

type IoResponse = Record<string, IoResponseValue>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface InverterResponse {
    fac: number;
    iac_total: number;
    ibat: number;
    ipv: number;
    pac_microgrid: number;
    pac_total: number;
    pbat: number;
    phi: number;
    ppv: number;
    sac_total: number;
    tmax: number;
    uac: number;
    ubat: number;
    upv: number;
}

interface ConfigurationsResponse {
    /** number string */
    CM_MarketingModuleCapacity: string;
    CN_CascadingRole: string;
    /** version string */
    DE_Software: string;
    /** integer string */
    EM_OperatingMode: string;
    /** integer string */
    EM_Prognosis_Charging: string;
    EM_RE_ENABLE_MICROGRID: 'true' | 'false';
    /** Array string */
    EM_ToU_Schedule: string;
    /** integer string */
    EM_USER_INPUT_TIME_ONE: string;
    /** integer string */
    EM_USER_INPUT_TIME_THREE: string;
    /** integer string */
    EM_USER_INPUT_TIME_TWO: string;
    /** integer string */
    EM_USOC: string;
    /** integer string */
    EM_US_GEN_POWER_SET_POINT: string;
    /** integer string */
    IC_BatteryModules: string;
    /** integer string */
    IC_InverterMaxPower_w: string;
    /** integer string */
    NVM_PfcFixedCosPhi: string;
    /** integer string */
    NVM_PfcIsFixedCosPhiActive: string;
    /** integer string */
    NVM_PfcIsFixedCosPhiLagging: string;
    /** integer string */
    SH_HeaterOperatingMode: string;
    /** integer string */
    SH_HeaterTemperatureMax: string;
    /** integer string */
    SH_HeaterTemperatureMin: string;
}

interface LatestDataResponse {
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

interface PowerMeterResponseEntry {
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

interface StatusResponse {
    /** not existing according to API specs but was there for v1 */
    ReturnCode?: number;
    Apparent_output: number;
    /** number string */
    BackupBuffer: string;
    BatteryCharging: boolean;
    BatteryDischarging: boolean;
    Consumption_Avg: number;
    Consumption_W: number;
    Fac: number;
    FlowConsumptionBattery: boolean;
    FlowConsumptionGrid: boolean;
    FlowConsumptionProduction: boolean;
    FlowGridBattery: boolean;
    FlowProductionBattery: boolean;
    FlowProductionGrid: boolean;
    GridFeedIn_W: number;
    IsSystemInstalled: number;
    /** 1 is API 2 is self-consumption */
    OperatingMode: '1' | '2';
    Pac_total_W: number;
    Production_W: number;
    /** relative state of charge */
    RSOC: number;
    RemainingCapacity_Wh: number;
    Sac1: number;
    Sac2: number;
    Sac3: number;
    SystemStatus: 'OnGrid' | 'OffGrid';
    Timestamp: 'string';
    /** user state of charge */
    USOC: number;
    Uac: number;
    Ubat: number;
    dischargeNotAllowed: boolean;
    generator_autostart: boolean;
}

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
                    await requestPromise({ url: `http://${ip}/api/v2/latestdata`, ...requestOptions });

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

    if (apiVersion === 'v2') {
        // cleanup old states
        for (const obj of apiStatesV1) {
            promises.push(adapter.delObjectAsync(obj._id));
        }
    }

    for (const obj of specificStates) {
        const id = obj._id;
        // use extend to update stuff like types if they were wrong, but preserve name
        promises.push(adapter.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
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

    const pollStates = async () => {
        // poll states every [30] seconds
        try {
            const data = await requestPromise(statusUrl);
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

        try {
            await requestLatestData();
        } catch (e: any) {
            adapter.log.warn(`[LATEST] Error receiving latest data: ${e.message}`);
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

        await adapter.setState(`info.lastSync`, Date.now(), true);
        const state = await adapter.getStateAsync(`info.connection`);
        if (!state?.val) {
            await adapter.setState(`info.connection`, true, true);
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
            adapter.setState(`info.lastSync`, Date.now(), true);

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
            adapter.setState(`info.lastSync`, Date.now(), true);

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

async function requestIosEndpoint(): Promise<void> {
    try {
        const iosUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/io` : `http://${ip}:8080/api/ios`;

        const res = await requestPromise({ url: iosUrl, ...requestOptions });
        const promises = [];

        promises.push(adapter.setStateAsync(`info.ios`, res, true));

        adapter.log.debug(`io json: ${res}`);

        const data: IoResponse = JSON.parse(res);

        const relevantIOs = ['DO_12', 'DO_13', 'DO_14'];

        for (const io of relevantIOs) {
            promises.push(adapter.setStateAsync(`ios.${io}`, !!data[io].status, true));
        }

        await Promise.all(promises);
    } catch (e: any) {
        // TODO: for now don't throw to not disturb users with current API
        adapter.log.debug(`Could not request ios endpoint: ${e.message}`);
        //throw new Error(`Could not request ios endpoint: ${e.message}`);
    }
}

async function requestInverterEndpoint(): Promise<void> {
    try {
        const inverterUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/inverter` : `http://${ip}:8080/api/inverter`;
        const res = await requestPromise({ url: inverterUrl, ...requestOptions });
        const promises = [];

        promises.push(adapter.setStateAsync(`info.inverter`, res, true));
        const data = JSON.parse(res);

        /** V1 has other response, handle it, v2 will only have the info state for now */
        if (apiVersion === 'v1') {
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

/**
 * Requests the latest data endpoint and syncs states accordignly
 */
async function requestLatestData(): Promise<void> {
    const latestDataUrl = apiVersion === 'v2' ? `http://${ip}/api/v2/latestdata` : `http://${ip}:8080/api/latestdata`;

    const data = await requestPromise({ url: latestDataUrl, ...requestOptions });

    adapter.log.debug(`Latest data: ${data}`);

    const latestData: LatestDataResponse = JSON.parse(data);

    await adapter.setStateAsync(
        'latestData.dcShutdownReason',
        decodeBitmapLikeObj(latestData.ic_status['DC Shutdown Reason'], 'Running'),
        true
    );
    await adapter.setStateAsync(
        'latestData.eclipseLed',
        decodeBitmapLikeObj(latestData.ic_status['Eclipse Led'], 'Unknown'),
        true
    );

    await adapter.setStateAsync('latestData.secondsSinceFullCharge', latestData.ic_status.secondssincefullcharge, true);
}

/**
 * Decodes a bitmap like object to extract the key where the value is true
 *
 * @param bitmapLike The object to decode
 * @param fallback fallback to return if no value is true
 */
function decodeBitmapLikeObj<T extends Record<string, boolean>, F extends string>(
    bitmapLike: T,
    fallback: F
): keyof T | F {
    const foundEntry = Object.entries(bitmapLike).find(value => value[1]);

    return foundEntry ? foundEntry[0] : fallback;
}

async function requestPowermeterEndpoint(): Promise<void> {
    try {
        const powermeterUrl =
            apiVersion === 'v2' ? `http://${ip}/api/v2/powermeter` : `http://${ip}:8080/api/powermeter`;
        const data = await requestPromise({ url: powermeterUrl, ...requestOptions });

        adapter.log.debug(`Powermeter: ${data}`);
        const promises = [];
        promises.push(adapter.setStateAsync(`info.powerMeter`, data, true));
        const powerMeterData: PowerMeterResponseEntry[] = JSON.parse(data);

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
            if (!powermeterCreated) {
                const objs = getPowermeterStates(pm, powerMeterData[pm].direction);
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
    } catch (e: any) {
        throw new Error(`Could not request powermeter endpoint: ${e.message}`);
    }
}

async function setBatteryStates(json: StatusResponse): Promise<void> {
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
    } else {
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
    const res = await requestPromise({ url: `http://${ip}/api/v2/configurations`, ...requestOptions });

    adapter.log.debug(`Configuration received: ${res}`);

    const data: ConfigurationsResponse = JSON.parse(res);

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
} else {
    module.exports = startAdapter;
}
