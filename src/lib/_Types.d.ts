export type ApiVersion = 'old' | 'v1' | 'v2' | 'legacy';

/**
 * Up from here endpoint interactions
 */

/** GET api/v2/io */
export type IoResponse = Record<string, IoResponseValue>;

type Binary = 0 | 1;

interface IoResponseValue {
    connector: string;
    status: Binary;
    usage: string;
}

/** GET api/v2/inverter */
export interface InverterResponse {
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

/** GET api/v2/configurations */
export interface ConfigurationsResponse {
    /** number string */
    CM_MarketingModuleCapacity: string;
    CN_CascadingRole: string;
    /** version string */
    DE_Software: string;
    /** integer string */
    EM_OperatingMode: string;
    /** integer string */
    EM_Prognosis_Charging: string;
    EM_RE_ENABLE_MICROGRID: 'false' | '0' | '1';
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
    SH_HeaterOperatingMode: '0' | '1';
    /** integer string */
    SH_HeaterTemperatureMax: string;
    /** integer string */
    SH_HeaterTemperatureMin: string;
}

/** GET api/v2/latestdata */
export interface LatestDataResponse {
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
            Brightness: number;
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

/** GET api/v2/powermeter */
export interface PowerMeterResponseEntry {
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

/** GET api/v2/status */
export interface StatusResponse {
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

/** GET api/v2/battery */
export interface BatteryResponse {
    balancechargerequest: Binary;
    chargecurrentlimit: number;
    cyclecount: number;
    dischargecurrentlimit: number;
    fullchargecapacity: number;
    maximumcelltemperature: number;
    maximumcellvoltage: number;
    /** Enum according to docs, but no info other than 0 */
    maximumcellvoltagenum: number;
    maximummodulecurrent: number;
    maximummoduledcvoltage: number;
    maximummoduletemperature: number;
    minimumcelltemperature: number;
    minimumcellvoltage: number;
    /** Enum according to docs, but no info other than 0 */
    minimumcellvoltagenum: number;
    minimummodulecurrent: number;
    minimummoduledcvoltage: number;
    minimummoduletemperature: number;
    relativestateofcharge: number;
    remainingcapacity: number;
    systemalarm: Binary;
    systemcurrent: number;
    systemdcvoltage: number;
    systemstatus: number;
    systemtime: Binary;
    systemwarning: Binary;
}

export interface LegacyResponse {
    devices: Record<string, LegacyDevice>;
}

/** GET :3480/data_request?id=sdata&output_format=json */
interface LegacyDevice {
    id: number;
    parent: number;
    [other: string]: any;
}

/** Create a new Record from a Record which has all non-boolean attributes removed */
type ExtractBooleanAttributesHelper<TRecord extends Record<string, unknown>> = {
    [Property in keyof TRecord as TRecord[Property] extends boolean ? Property : never]: TRecord[Property];
};

/** Extract attribute names of Record, which are of type boolean */
export type ExtractBooleanAttributes<T> = keyof ExtractBooleanAttributesHelper<T>;
