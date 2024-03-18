import * as utils from '@iobroker/adapter-core';
import { generalAPIStates, oldAPIStates, getPowermeterStates, apiStatesV2, apiStatesV1 } from './lib/utils';
import axios, { AxiosRequestConfig } from 'axios';

import {
    ApiVersion,
    IoResponse,
    ConfigurationsResponse,
    LatestDataResponse,
    PowerMeterResponseEntry,
    StatusResponse,
    LegacyResponse,
    InverterResponse,
    BatteryResponse,
    ExtractBooleanAttributes
} from './lib/_Types';

class Sonnen extends utils.Adapter {
    private apiVersion: ApiVersion | undefined;
    private polling: NodeJS.Timeout | undefined;
    private ip = '';
    private pollingTime: number = 7_000;
    private restartTimer: NodeJS.Timeout | undefined;
    private powermeterCreated = false;
    /** indicator if inverter endpoint is supported */
    private inverterEndpoint = false;
    private requestOptions: AxiosRequestConfig = { headers: {} };

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({ ...options, name: 'sonnen' });

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private async onUnload(callback: () => void): Promise<void> {
        try {
            clearTimeout(this.polling);
            if (this.restartTimer) {
                clearTimeout(this.restartTimer);
            }
            this.log.info(`[END] Stopping sonnen this...`);
            await this.setStateAsync(`info.connection`, false, true);
            callback();
        } catch {
            callback();
        }
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        if (!this.config.ip) {
            this.log.warn('[START] No IP-address set');
            return;
        }

        this.log.info(`[START] Starting sonnen adapter`);

        this.ip = this.config.ip;

        if (this.config.pollInterval) {
            this.pollingTime = this.config.pollInterval;
        }
        this.log.debug(`[INFO] Configured polling interval: ${this.pollingTime}`);

        // all states changes inside the adapters namespace are subscribed
        this.subscribeStates('*');

        this.log.debug(`[START] Check API`);

        if (this.config.token) {
            this.log.debug('[START] Auth-Token provided... trying official API');
            this.requestOptions.headers!['Auth-Token'] = this.config.token;
            try {
                await axios({ url: `http://${this.ip}/api/v2/latestdata`, ...this.requestOptions });

                this.apiVersion = 'v2';
                this.log.debug('[START] Check ok, using official API');
                return void this.main();
            } catch (e: any) {
                this.log.error(`Auth-Token provided, but could not use official API: ${e.message}`);
            }
        }

        try {
            await axios({ url: `http://${this.ip}:8080/api/v1/status`, timeout: 2000 });
            this.log.debug(`[START] 8080 API detected`);
            this.apiVersion = 'v1';
            return void this.main();
        } catch (e: any) {
            this.log.debug(`[START] It's not 8080, because ${e.message}`);
        }

        try {
            // test if both works, else use legacy, because of incomplete implementation of API
            await axios(`http://${this.ip}:7979/rest/devices/battery/M03`);
            await axios(`http://${this.ip}:7979/rest/devices/battery/M034`);
            this.apiVersion = 'old';
            this.log.debug(`[START] 7979 API detected`);
            return void this.oldAPImain();
        } catch (e: any) {
            this.log.debug(`[START] It's not 7979, because ${e.message}`);
        }

        try {
            await axios(`http://${this.ip}:3480/data_request?id=sdata&output_format=json`);
            this.apiVersion = 'legacy';
            return void this.legacyAPImain();
        } catch (e: any) {
            this.log.warn(`[START] Could not get API version... restarting in 30 seconds: ${e.message}`);
            this.restartTimer = setTimeout(this.restart, 30_000);
        }
    }

    /**
     * Is called if a subscribed state changes
     */
    private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (!id || !state || state.ack) {
            return;
        } // Ignore acknowledged state changes or error states
        id = id.substring(this.namespace.length + 1); // remove instance name and id
        const stateVal = state.val;

        this.log.debug(`[COMMAND] State Change - ID: ${id}; State: ${stateVal}`);

        if (id === `control.charge`) {
            try {
                if (this.apiVersion === 'v2') {
                    await axios({
                        method: 'POST',
                        url: `http://${this.ip}/api/v2/setpoint/charge/${stateVal}`,
                        ...this.requestOptions
                    });
                } else {
                    await axios({ method: 'PUT', url: `http://${this.ip}:8080/api/v1/setpoint/charge/${stateVal}` });
                }
                this.setState(`control.charge`, state, true);
                this.log.debug(`Sent ${stateVal} to charge`);
            } catch (e: any) {
                this.log.warn(`Error changing charge: ${e.message}`);
            }
        } else if (id === `control.discharge`) {
            try {
                if (this.apiVersion === 'v2') {
                    await axios({
                        method: 'POST',
                        url: `http://${this.ip}/api/v2/setpoint/discharge/${stateVal}`,
                        ...this.requestOptions
                    });
                } else {
                    await axios({ method: 'PUT', url: `http://${this.ip}:8080/api/v1/setpoint/discharge/${stateVal}` });
                }
                this.setState(`control.discharge`, state, true);
                this.log.debug(`Sent ${stateVal} to discharge`);
            } catch (e: any) {
                this.log.warn(`Error changing discharge: ${e.message}`);
            }
        } else if (id.startsWith('configurations.')) {
            const command = id.split('.')[1];
            const data: Record<string, string> = {};
            const val = typeof stateVal === 'number' ? stateVal.toString() : stateVal;
            data[command] = val as string;
            this.log.debug(`[PUT] ==> Sent ${JSON.stringify(data)} to configurations`);
            try {
                await axios({
                    method: 'PUT',
                    url: `http://${this.ip}/api/v2/configurations`,
                    ...this.requestOptions,
                    data
                });
            } catch (e: any) {
                this.log.error(`Could not change configuration "${command}": ${e.message}`);
            }
        }
    }

    /**
     * Main logic for v1 and v2 API
     */
    async main(): Promise<void> {
        const statusUrl =
            this.apiVersion === 'v2' ? `http://${this.ip}/api/v2/status` : `http://${this.ip}:8080/api/v1/status`;

        // create objects
        const promises = [];
        for (const obj of generalAPIStates) {
            const id = obj._id;
            // use extend to update stuff like types if they were wrong, but preserve name
            promises.push(this.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
        }
        const specificStates = this.apiVersion === 'v2' ? apiStatesV2 : apiStatesV1;

        if (this.apiVersion === 'v2') {
            // cleanup old states
            for (const obj of apiStatesV1) {
                promises.push(this.delObjectAsync(obj._id));
            }
        }

        for (const obj of specificStates) {
            const id = obj._id;
            // use extend to update stuff like types if they were wrong, but preserve name
            promises.push(this.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
        }

        if (this.config.pollOnlineStatus) {
            promises.push(
                this.extendObjectAsync('status.onlineStatus', {
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
            promises.push(this.delObjectAsync('status.onlineStatus'));
        }

        await Promise.all(promises);

        const pollStates: () => Promise<void> = async () => {
            // poll states every [30] seconds
            try {
                const data: StatusResponse = (await axios(statusUrl)).data;
                const state = await this.getStateAsync(`info.connection`);
                if (!state || !state.val) {
                    this.setState(`info.connection`, true, true);
                    this.log.debug(`[CONNECT] Connection successfuly established`);
                }

                await this.setBatteryStates(data);

                try {
                    await this.requestPowermeterEndpoint();
                    if (this.config.pollOnlineStatus) {
                        await this.requestOnlineStatus();
                    }
                    await this.requestIosEndpoint();
                    await this.requestInverterEndpoint();

                    if (this.apiVersion === 'v2') {
                        await this.requestBatteryEndpoint();
                    }
                } catch (e: any) {
                    this.log.warn(`[ADDITIONAL] Error on requesting additional endpoints: ${e.message}`);
                }

                try {
                    await this.requestSettings();
                } catch (e: any) {
                    this.log.warn(`[SETTINGS] Error receiving configuration: ${e.message}`);
                }
            } catch (e: any) {
                this.log.warn(`[REQUEST] <== ${e.message}`);
                this.setState(`info.connection`, false, true);
                this.log.warn(`[CONNECT] Connection failed`);
            }

            try {
                await this.requestLatestData();
            } catch (e: any) {
                this.log.warn(`[LATEST] Error receiving latest data: ${e.message}`);
            }

            this.polling = setTimeout(pollStates, this.pollingTime);
        };

        pollStates();
    }

    /**
     * Main logic for "old" Port 7979 API
     */
    async oldAPImain(): Promise<void> {
        // create objects
        let promises = [];
        for (const obj of oldAPIStates) {
            const id = obj._id;
            // use extend to update stuff like types if they were wrong, but preserve name
            promises.push(this.extendObjectAsync(id, obj, { preserve: { common: ['name'] } }));
        }

        await Promise.all(promises);
        promises = [];
        promises.push(this.requestStateAndSetOldAPI(`M03`, `status.production`));
        promises.push(this.requestStateAndSetOldAPI(`M04`, `status.consumption`));
        promises.push(this.requestStateAndSetOldAPI(`M05`, `status.relativeSoc`));
        promises.push(this.requestStateAndSetOldAPI(`M06`, `status.operatingMode`));
        promises.push(this.requestStateAndSetOldAPI(`M07`, `status.consumptionL1`));
        promises.push(this.requestStateAndSetOldAPI(`M08`, `status.consumptionL2`));
        promises.push(this.requestStateAndSetOldAPI(`M09`, `status.consumptionL3`));
        promises.push(this.requestStateAndSetOldAPI(`M34`, `status.pacDischarge`));
        promises.push(this.requestStateAndSetOldAPI(`M35`, `status.pacCharge`));

        try {
            await Promise.all(promises);

            await this.setState(`info.lastSync`, Date.now(), true);
            const state = await this.getStateAsync(`info.connection`);
            if (!state?.val) {
                await this.setState(`info.connection`, true, true);
            }
        } catch (e: any) {
            this.log.warn(`[DATA] Error getting Data ${e.message}`);
        }

        const pollStates: () => Promise<void> = async () => {
            // poll states every configured seconds
            const promises = [];
            promises.push(this.requestStateAndSetOldAPI(`M03`, `status.production`));
            promises.push(this.requestStateAndSetOldAPI(`M04`, `status.consumption`));
            promises.push(this.requestStateAndSetOldAPI(`M05`, `status.relativeSoc`));
            promises.push(this.requestStateAndSetOldAPI(`M06`, `status.operatingMode`));
            promises.push(this.requestStateAndSetOldAPI(`M34`, `status.pacDischarge`));
            promises.push(this.requestStateAndSetOldAPI(`M35`, `status.pacCharge`));
            promises.push(this.requestStateAndSetOldAPI(`M07`, `status.consumptionL1`));
            promises.push(this.requestStateAndSetOldAPI(`M08`, `status.consumptionL2`));
            promises.push(this.requestStateAndSetOldAPI(`M09`, `status.consumptionL3`));

            try {
                await Promise.all(promises);
                this.setState(`info.lastSync`, Date.now(), true);

                this.setStateChanged(`info.connection`, true, true);
            } catch (e: any) {
                await this.setStateChangedAsync(`info.connection`, false, true);
                this.log.warn(`[DATA] Error getting Data ${e.message}`);
            }

            this.polling = setTimeout(pollStates, this.pollingTime);
        };

        pollStates();
    }

    /**
     * Main logic for "legacy" Port 3480 API
     */
    async legacyAPImain(): Promise<void> {
        // here we store the id of the battery
        let batteryId: number | undefined;
        try {
            const data: LegacyResponse = (
                await axios(`http://${this.ip}:3480/data_request?id=sdata&output_format=json`)
            ).data;

            // we got data successfully -> mark as connected
            this.setState(`info.connection`, true, true);
            this.log.debug(`[CONNECT] Connection successfuly established`);

            for (const device of Object.values(data.devices)) {
                if (device.parent === 0) {
                    batteryId = device.id;
                    // create channel
                    await this.setObjectNotExistsAsync('main', {
                        type: 'channel',
                        common: {
                            name: 'Main information'
                        },
                        native: {}
                    });

                    // this should be the sonnen battery
                    for (const attr of Object.keys(device)) {
                        const stateVal = this.convertLegacyState(device[attr]);
                        await this.setObjectNotExistsAsync(`main.${attr}`, {
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
                    await this.setObjectNotExistsAsync(device.id.toString(), {
                        type: 'channel',
                        common: {
                            name: device.name
                        },
                        native: {}
                    });

                    for (const attr of Object.keys(device)) {
                        const stateVal = this.convertLegacyState(device[attr]);
                        await this.setObjectNotExistsAsync(`${device.id}.${attr}`, {
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
            this.log.error(`Could not get initial data - restarting adapter: ${e.message}`);
            return void this.restart();
        }

        const pollStates: () => Promise<void> = async () => {
            try {
                const data: LegacyResponse = (
                    await axios(`http://${this.ip}:3480/data_request?id=sdata&output_format=json`)
                ).data;

                for (const device of Object.values(data.devices)) {
                    if (device.id === batteryId) {
                        for (const attr of Object.keys(device)) {
                            const stateVal = this.convertLegacyState(device[attr]);
                            await this.setStateAsync(`main.${attr}`, stateVal, true);
                        }
                    } else if (device.parent === batteryId) {
                        for (const attr of Object.keys(device)) {
                            const stateVal = this.convertLegacyState(device[attr]);
                            await this.setStateAsync(`${device.id}.${attr}`, stateVal, true);
                        }
                    }
                }

                // update the lastSync manually
                this.setState(`info.lastSync`, Date.now(), true);

                // update the info connection state
                const state = await this.getStateAsync(`info.connection`);
                if (!state || !state.val) {
                    this.setState(`info.connection`, true, true);
                    this.log.debug(`[CONNECT] Connection successfuly established`);
                }
            } catch (e: any) {
                this.log.warn(`[REQUEST] <== ${e.message}`);
                this.setState(`info.connection`, false, true);
                this.log.warn(`[CONNECT] Connection failed`);
            }

            setTimeout(pollStates, this.pollingTime);
        };

        pollStates();
    }

    /**
     * Converts a state value to the correct type
     *
     * @param stateVal - state value to convert
     */
    convertLegacyState(stateVal: string): number | boolean | string {
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

    /**
     * Request settings for v1 or v2 API
     */
    async requestSettings(): Promise<void> {
        if (this.apiVersion === 'v2') {
            return this.requestSettingsV2();
        }

        const rawData = JSON.stringify(await axios(`http://${this.ip}:8080/api/configuration`));
        this.log.debug(`[SETTINGS] Configuration received: ${rawData}`);
        await this.setStateAsync(`info.configuration`, rawData, true);
    }

    /**
     * Requests the battery endpoint of API v2 and syncs states accordingly
     */
    async requestBatteryEndpoint(): Promise<void> {
        try {
            const data: BatteryResponse = (
                await axios({
                    url: `http://${this.ip}/api/v2/battery`,
                    ...this.requestOptions
                })
            ).data;

            this.log.debug(`Battery json: ${JSON.stringify(data)}`);

            await this.setStateAsync('battery.cyclecount', data.cyclecount, true);
            await this.setStateAsync('battery.balanceChargeRequest', !!data.balancechargerequest, true);
        } catch (e: any) {
            throw new Error(`Could not request battery endpoint: ${e.message}`);
        }
    }

    /**
     * Request io(s) endpoint of v1 and v2 API
     */
    async requestIosEndpoint(): Promise<void> {
        try {
            const iosUrl = this.apiVersion === 'v2' ? `http://${this.ip}/api/v2/io` : `http://${this.ip}:8080/api/ios`;

            const data: IoResponse = (await axios({ url: iosUrl, ...this.requestOptions })).data;
            const rawData = JSON.stringify(data);

            const promises = [];

            promises.push(this.setStateAsync(`info.ios`, rawData, true));

            this.log.debug(`io json: ${rawData}`);

            const relevantIOs = ['DI_10', 'DO_11', 'DO_12', 'DO_13', 'DO_14'];

            for (const io of relevantIOs) {
                promises.push(this.setStateAsync(`ios.${io}`, !!data[io].status, true));
            }

            await Promise.all(promises);
        } catch (e: any) {
            throw new Error(`Could not request ios endpoint: ${e.message}`);
        }
    }

    /**
     * Request inverter endpoint of v1 and v2 API
     */
    async requestInverterEndpoint(): Promise<void> {
        try {
            const inverterUrl =
                this.apiVersion === 'v2' ? `http://${this.ip}/api/v2/inverter` : `http://${this.ip}:8080/api/inverter`;
            const data = (await axios({ url: inverterUrl, ...this.requestOptions })).data;
            const promises = [];

            promises.push(this.setStateAsync(`info.inverter`, JSON.stringify(data), true));

            // V1 has other response, handle it accordingly
            if (this.apiVersion === 'v1') {
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
                    promises.push(this.setStateAsync(`inverter.${state}`, parseFloat(data.status[state]), true));
                }
            } else if (this.apiVersion === 'v2') {
                const invererData: InverterResponse = data;

                promises.push(this.setStateAsync('inverter.pacTotal', invererData.pac_total, true));
                promises.push(this.setStateAsync('inverter.tmax', invererData.tmax, true));
                promises.push(this.setStateAsync('inverter.ubat', invererData.ubat, true));
                promises.push(this.setStateAsync('inverter.fac', invererData.fac, true));
                promises.push(this.setStateAsync('inverter.iacTotal', invererData.iac_total, true));
                promises.push(this.setStateAsync('inverter.ibat', invererData.ibat, true));
                promises.push(this.setStateAsync('inverter.ipv', invererData.ipv, true));
                promises.push(this.setStateAsync('inverter.pacMicrogrid', invererData.pac_microgrid, true));
                promises.push(this.setStateAsync('inverter.pbat', invererData.pbat, true));
                promises.push(this.setStateAsync('inverter.phi', invererData.phi, true));
                promises.push(this.setStateAsync('inverter.ppv', invererData.ppv, true));
                promises.push(this.setStateAsync('inverter.sacTotal', invererData.sac_total, true));
                promises.push(this.setStateAsync('inverter.uac', invererData.uac, true));
                promises.push(this.setStateAsync('inverter.upv', invererData.upv, true));
            }

            await Promise.all(promises);

            // inverter endpoint exists
            this.inverterEndpoint = true;
        } catch (e: any) {
            if (this.inverterEndpoint) {
                throw new Error(`Could not request inverter endpoint: ${e.message}`);
            } else {
                // not all batteries seem to have this endpoint so don't throw an error if it was never there, see Issue #55
                this.log.debug(`Could not request inverter endpoint: ${e.message}`);
            }
        }
    }

    /**
     * Request online status of the battery
     * Works for batteries with v1 and v2 API
     * Every request also generates a request from the battery to the internet
     */
    async requestOnlineStatus(): Promise<void> {
        try {
            const onlineState: boolean = (await axios(`http://${this.ip}/api/online_status`)).data;

            await this.setStateAsync(`status.onlineStatus`, onlineState, true);
        } catch (e: any) {
            throw new Error(`Could not request online status: ${e.message}`);
        }
    }

    /**
     * Requests the latest data endpoint of v1 and v2 API and syncs states accordignly
     */
    async requestLatestData(): Promise<void> {
        const latestDataUrl =
            this.apiVersion === 'v2' ? `http://${this.ip}/api/v2/latestdata` : `http://${this.ip}:8080/api/latestdata`;

        const data: LatestDataResponse = (await axios({ url: latestDataUrl, ...this.requestOptions })).data;

        this.log.debug(`Latest data: ${JSON.stringify(data)}`);

        await this.setStateAsync(
            'latestData.dcShutdownReason',
            this.decodeBitmapLikeObj(data.ic_status['DC Shutdown Reason'], 'Running'),
            true
        );

        await this.setStateAsync(
            'latestData.eclipseLed',
            this.decodeBitmapLikeObj(data.ic_status['Eclipse Led'], 'Unknown'),
            true
        );

        await this.setStateAsync('latestData.eclipseLedBrightness', data.ic_status['Eclipse Led'].Brightness, true);
        await this.setStateAsync('latestData.secondsSinceFullCharge', data.ic_status.secondssincefullcharge, true);
    }

    /**
     * Decodes a bitmap like object to extract the key where the value is true
     *
     * @param bitmapLike The object to decode
     * @param fallback fallback to return if no value is true
     */
    decodeBitmapLikeObj<TBitmap extends Record<string, unknown>, TFallback extends string>(
        bitmapLike: TBitmap,
        fallback: TFallback
    ): ExtractBooleanAttributes<TBitmap> | TFallback {
        const foundEntry = Object.entries(bitmapLike).find(value => value[1] === true);
        return foundEntry ? (foundEntry[0] as ExtractBooleanAttributes<TBitmap>) : fallback;
    }

    /**
     * Request powermeter endpoint of v1 and v2 API
     */
    async requestPowermeterEndpoint(): Promise<void> {
        try {
            const powermeterUrl =
                this.apiVersion === 'v2'
                    ? `http://${this.ip}/api/v2/powermeter`
                    : `http://${this.ip}:8080/api/powermeter`;
            const data: PowerMeterResponseEntry[] = (await axios({ url: powermeterUrl, ...this.requestOptions })).data;
            const rawData = JSON.stringify(data);

            this.log.debug(`Powermeter: ${rawData}`);
            const promises = [];
            promises.push(this.setStateAsync(`info.powerMeter`, rawData, true));

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
                'w_l3',
                'va_total',
                'var_total',
                'w_total'
            ] as const;

            // we have multiple powermeters
            for (const pm in data) {
                if (!this.powermeterCreated) {
                    const objs = getPowermeterStates(pm, data[pm].direction);
                    for (const obj of objs) {
                        const id = obj._id;
                        await this.extendObjectAsync(id, obj);
                    }
                }

                for (const state of relevantStates) {
                    promises.push(this.setStateAsync(`powermeter.${pm}.${state}`, data[pm][state], true));
                }
            }

            // all powermeters created
            this.powermeterCreated = true;

            await Promise.all(promises);
        } catch (e: any) {
            throw new Error(`Could not request powermeter endpoint: ${e.message}`);
        }
    }

    /**
     * Sets the battery states, which have been received from v1 or v2 API
     *
     * @param json Status response from the battery
     */
    async setBatteryStates(json: StatusResponse): Promise<void> {
        if (json.ReturnCode) {
            this.log.warn(`[DATA] <== Return Code ${json.ReturnCode}`);
            return;
        }

        const promises = [];

        promises.push(this.setStateAsync(`info.lastSync`, Date.now(), true));

        promises.push(this.setStateAsync(`status.consumption`, json.Consumption_W, true));
        promises.push(this.setStateAsync(`status.batteryCharging`, json.BatteryCharging, true));
        promises.push(this.setStateAsync(`status.production`, json.Production_W, true));
        promises.push(this.setStateAsync(`status.pacTotal`, json.Pac_total_W, true));
        promises.push(this.setStateAsync(`status.relativeSoc`, json.RSOC, true));
        promises.push(this.setStateAsync(`status.userSoc`, json.USOC, true));
        promises.push(this.setStateAsync(`status.acFrequency`, json.Fac, true));
        promises.push(this.setStateAsync(`status.acVoltage`, json.Uac, true));
        promises.push(this.setStateAsync(`status.batteryVoltage`, json.Ubat, true));

        const systemTime = new Date(json.Timestamp);
        promises.push(this.setStateAsync(`status.systemTime`, systemTime.getTime(), true));

        if (json.IsSystemInstalled === 1) {
            promises.push(this.setStateAsync(`status.systemInstalled`, true, true));
        } else {
            promises.push(this.setStateAsync(`status.systemInstalled`, false, true));
        }

        promises.push(this.setStateAsync(`status.gridFeedIn`, json.GridFeedIn_W, true));
        promises.push(this.setStateAsync(`status.flowConsumptionBattery`, json.FlowConsumptionBattery, true));
        promises.push(this.setStateAsync(`status.flowConsumptionGrid`, json.FlowConsumptionGrid, true));
        promises.push(this.setStateAsync(`status.flowConsumptionProduction`, json.FlowConsumptionProduction, true));
        promises.push(this.setStateAsync(`status.flowGridBattery`, json.FlowGridBattery, true));
        promises.push(this.setStateAsync(`status.flowProductionBattery`, json.FlowProductionBattery, true));
        promises.push(this.setStateAsync(`status.flowProductionGrid`, json.FlowProductionGrid, true));
        promises.push(this.setStateAsync('status.systemStatus', json.SystemStatus, true));
        promises.push(this.setStateAsync('status.operatingMode', parseInt(json.OperatingMode), true));

        await Promise.all(promises);
    }

    /**
     * Requests state by given code from old Port 7979 API
     *
     * @param code code which will be requested
     * @param stateId state id where the retrived value will be set too
     */
    async requestStateAndSetOldAPI(code: string, stateId: string): Promise<void> {
        let res = (await axios(`http://${this.ip}:7979/rest/devices/battery/${code}`)).data;
        res = res.trim();
        this.log.debug(`[DATA] Received ${res} for ${code} and set it to ${stateId}`);
        this.setState(stateId, parseFloat(res), true);
    }

    /**
     * Requests configurations endpoint for V2 api
     */
    async requestSettingsV2(): Promise<void> {
        const data: ConfigurationsResponse = (
            await axios({
                url: `http://${this.ip}/api/v2/configurations`,
                ...this.requestOptions
            })
        ).data;

        this.log.debug(`Configuration received: ${JSON.stringify(data)}`);

        for (const [id, val] of Object.entries(data)) {
            let value = val;
            if (value && !isNaN(Number(value))) {
                value = parseFloat(value);
            }
            await this.setState(`configurations.${id}`, value, true);
        }
    }
}

// If started as allInOne/compact mode => return function to create instance
if (require.main === module) {
    // start the instance directly
    (() => new Sonnen())();
} else {
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Sonnen(options);
}
