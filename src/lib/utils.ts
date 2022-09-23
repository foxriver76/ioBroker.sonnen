export const newAPIStates: ioBroker.AnyObject[] = [
    {
        _id: `status.userSoc`,
        type: `state`,
        common: {
            name: `User State of Charge`,
            type: `number`,
            role: `value.usoc`,
            read: true,
            write: false,
            desc: `User State of Charge`,
            min: 0,
            max: 100,
            unit: `%`
        },
        native: {}
    },
    {
        _id: `status.acFrequency`,
        type: `state`,
        common: {
            name: `AC frequency`,
            type: `number`,
            role: `value.fac`,
            read: true,
            write: false,
            desc: `AC frequency in hertz`,
            unit: `hertz`
        },
        native: {}
    },
    {
        _id: `status.acVoltage`,
        type: `state`,
        common: {
            name: `AC voltage`,
            type: `number`,
            role: `value.uac`,
            read: true,
            write: false,
            desc: `AC voltage in volts`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `status.batteryVoltage`,
        type: `state`,
        common: {
            name: `Battery voltage`,
            type: `number`,
            role: `value.ubat`,
            read: true,
            write: false,
            desc: `Battery volatge in volts`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `status.systemTime`,
        type: `state`,
        common: {
            name: `System time`,
            type: `string`,
            role: `value.datetime`,
            read: true,
            write: false,
            desc: `System time`
        },
        native: {}
    },
    {
        _id: `status.systemInstalled`,
        type: `state`,
        common: {
            name: `System Installed`,
            type: `boolean`,
            role: `indicator.systemInstalled`,
            read: true,
            write: false,
            def: false,
            desc: `System is installed or not`
        },
        native: {}
    },
    {
        _id: `status.batteryCharging`,
        type: `state`,
        common: {
            name: `Battery charging`,
            type: `boolean`,
            role: `indicator.batteryCharging`,
            read: true,
            write: false,
            desc: `System is installed or not`
        },
        native: {}
    },
    {
        _id: `status.flowConsumptionBattery`,
        type: `state`,
        common: {
            name: `Flow consumption battery`,
            type: `boolean`,
            role: `indicator.flowConsumptionBattery`,
            read: true,
            write: false,
            desc: `If consuming from battery`
        },
        native: {}
    },
    {
        _id: `status.flowConsumptionGrid`,
        type: `state`,
        common: {
            name: `Flow consumption Grid`,
            type: `boolean`,
            role: `indicator.flowConsumptionGrid`,
            read: true,
            write: false,
            desc: `If consuming from grid`
        },
        native: {}
    },
    {
        _id: `status.flowConsumptionProduction`,
        type: `state`,
        common: {
            name: `Flow consumption production`,
            type: `boolean`,
            role: `indicator.flowConsumptionProduction`,
            read: true,
            write: false,
            desc: `If consuming from production`
        },
        native: {}
    },
    {
        _id: `status.flowGridBattery`,
        type: `state`,
        common: {
            name: `Flow grid battery`,
            type: `boolean`,
            role: `indicator.flowGridBattery`,
            read: true,
            write: false,
            def: false,
            desc: `If charging from grid`
        },
        native: {}
    },
    {
        _id: `status.flowProductionBattery`,
        type: `state`,
        common: {
            name: `Flow production battery`,
            type: `boolean`,
            role: `indicator.flowProductionBattery`,
            read: true,
            write: false,
            desc: `If charging from production`
        },
        native: {}
    },
    {
        _id: `status.flowProductionGrid`,
        type: `state`,
        common: {
            name: `Flow production grid`,
            type: `boolean`,
            role: `indicator.flowProductionGrid`,
            read: true,
            write: false,
            desc: `If production flows to grid`
        },
        native: {}
    },
    {
        _id: `status.gridFeedIn`,
        type: `state`,
        common: {
            name: `Amount of grid feed in`,
            type: `number`,
            role: `value.gridFeedIn`,
            read: true,
            write: false,
            desc: `If negative consuming from grid`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.systemStatus`,
        type: `state`,
        common: {
            name: `Indicates if the battery is connected to the grid`,
            type: `string`,
            role: `text`,
            read: true,
            write: false,
            desc: `If running OnGrid or OffGrid`
        },
        native: {}
    },
    {
        _id: `control`,
        type: `channel`,
        common: {
            name: `Controlling`
        },
        native: {}
    },
    {
        _id: `control.charge`,
        type: `state`,
        common: {
            name: `Battery charging`,
            type: `number`,
            role: `value.charge`,
            read: true,
            write: true,
            desc: `Battery charge rate`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `control.discharge`,
        type: `state`,
        common: {
            name: `Battery charging`,
            type: `number`,
            role: `value.discharge`,
            read: true,
            write: true,
            desc: `Battery discharge rate`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.pacTotal`,
        type: `state`,
        common: {
            name: `Power AC Total`,
            type: `number`,
            role: `value.pac`,
            read: true,
            write: false,
            desc: `Inverter AC Power greater than 0 is discharging, smaller charging`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `info.configuration`,
        type: `state`,
        common: {
            name: `Battery Configuration`,
            type: `string`,
            role: `json`,
            read: true,
            write: false,
            desc: `Configuration of your sonnen battery as JSON`
        },
        native: {}
    },
    {
        _id: `info.ios`,
        type: `state`,
        common: {
            name: `Battery Discrete IO Information`,
            type: `string`,
            role: `json`,
            read: true,
            write: false,
            desc: `Discrete IO information of your sonnen battery as JSON`
        },
        native: {}
    },
    {
        _id: `info.inverter`,
        type: `state`,
        common: {
            name: `Battery Inverter Information`,
            type: `string`,
            role: `json`,
            read: true,
            write: false,
            desc: `Inverter information of your sonnen battery as JSON`
        },
        native: {}
    },
    {
        _id: `info.powerMeter`,
        type: `state`,
        common: {
            name: `Battery Power Meter Information`,
            type: `string`,
            role: `json`,
            read: true,
            write: false,
            desc: `Power meter information of your sonnen battery as JSON`
        },
        native: {}
    },
    {
        _id: `powermeter`,
        type: `channel`,
        common: {
            name: `Powermeter Information`
        },
        native: {}
    },
    {
        _id: `ios`,
        type: `channel`,
        common: {
            name: `Discrete IO Information`
        },
        native: {}
    },
    {
        _id: `ios.DO_12`,
        type: `state`,
        common: {
            name: `Self Consumption Relay`,
            type: `boolean`,
            role: `status`,
            read: true,
            write: false,
            desc: `Self Consumption Relay Status`
        },
        native: {}
    },
    {
        _id: `ios.DO_13`,
        type: `state`,
        common: {
            name: `PV Reduction 1`,
            type: `boolean`,
            role: `status`,
            read: true,
            write: false,
            desc: `PV Reduction 1 Status`
        },
        native: {}
    },
    {
        _id: `ios.DO_14`,
        type: `state`,
        common: {
            name: `PV Reduction 2`,
            type: `boolean`,
            role: `status`,
            read: true,
            write: false,
            desc: `PV Reduction 2 Status`
        },
        native: {}
    },
    {
        _id: `inverter`,
        type: `channel`,
        common: {
            name: `Inverter Information`
        },
        native: {}
    },
    {
        _id: `inverter.iac1`,
        type: `state`,
        common: {
            name: `Phase 1 Ampere AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Amperes of Phase 1`,
            unit: `amp`
        },
        native: {}
    },
    {
        _id: `inverter.iac2`,
        type: `state`,
        common: {
            name: `Phase 2 Ampere AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Amperes of Phase 2`,
            unit: `amp`
        },
        native: {}
    },
    {
        _id: `inverter.iac3`,
        type: `state`,
        common: {
            name: `Phase 3 Ampere AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Amperes of Phase 3`,
            unit: `amp`
        },
        native: {}
    },
    {
        _id: `inverter.uac1`,
        type: `state`,
        common: {
            name: `Phase 1 Current AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Voltage of Phase 1`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `inverter.uac2`,
        type: `state`,
        common: {
            name: `Phase 2 Current AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Voltage of Phase 2`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `inverter.uac3`,
        type: `state`,
        common: {
            name: `Phase 3 Current AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Voltage of Phase 3`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `inverter.udc`,
        type: `state`,
        common: {
            name: `Voltage DC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Direct Current Voltage`,
            unit: `volts`
        },
        native: {}
    },
    {
        _id: `inverter.temphmi`,
        type: `state`,
        common: {
            name: `Temperature HMI`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Temperature of HMI`,
            unit: `°C`
        },
        native: {}
    },
    {
        _id: `inverter.tempbdc`,
        type: `state`,
        common: {
            name: `Temperature BDC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Temperature of BDC`,
            unit: `°C`
        },
        native: {}
    },
    {
        _id: `inverter.temppu`,
        type: `state`,
        common: {
            name: `Temperature PU`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Temperature of PU`,
            unit: `°C`
        },
        native: {}
    },
    {
        _id: `inverter.pac1`,
        type: `state`,
        common: {
            name: `Phase 1 Power AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Power of Phase 1`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `inverter.pac2`,
        type: `state`,
        common: {
            name: `Phase 2 Power AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Power of Phase 2`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `inverter.pac3`,
        type: `state`,
        common: {
            name: `Phase 3 Power AC`,
            type: `number`,
            role: `value`,
            read: true,
            write: false,
            desc: `Accelerating Current Power of Phase 3`,
            unit: `watts`
        },
        native: {}
    }
];

/**
 * Returns the powermeter states objects in an array
 *
 * @param id - powermeter id
 * @param direction - used as name of channel
 */
export const getPowermeterStates: (id: string, direction: string) => ioBroker.AnyObject[] = (
    id: string,
    direction: string
) => {
    return [
        {
            _id: `powermeter.${id}`,
            type: `channel`,
            common: {
                name: `Powermeter ${direction}`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.a_l1`,
            type: `state`,
            common: {
                name: `Ampere Phase 1`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Amperes measured on Phase 1`,
                unit: `amp`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.a_l2`,
            type: `state`,
            common: {
                name: `Ampere Phase 2`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Amperes measured on Phase 2`,
                unit: `amp`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.a_l3`,
            type: `state`,
            common: {
                name: `Ampere Phase 3`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Amperes measured on Phase 3`,
                unit: `amp`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l1_l2`,
            type: `state`,
            common: {
                name: `Voltage Phase 1 and 2`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 1 and 2`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l2_l3`,
            type: `state`,
            common: {
                name: `Voltage Phase 2 and 3`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 2 and 3`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l3_l1`,
            type: `state`,
            common: {
                name: `Voltage Phase 1 and 3`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 1 and 3`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l1_n`,
            type: `state`,
            common: {
                name: `Voltage Phase 1 and Neutral`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 1 and Neutral`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l2_n`,
            type: `state`,
            common: {
                name: `Voltage Phase 2 and Neutral`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 2 and Neutral`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.v_l3_n`,
            type: `state`,
            common: {
                name: `Voltage Phase 3 and Neutral`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Voltage of Phase 3 and Neutral`,
                unit: 'volts'
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.kwh_exported`,
            type: `state`,
            common: {
                name: `Exported kWh`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Amount of exported kWh`,
                unit: `kWh`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.kwh_imported`,
            type: `state`,
            common: {
                name: `Imported kWh`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Amount of imported kWh`,
                unit: `kWh`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.w_l1`,
            type: `state`,
            common: {
                name: `Watts Phase 1`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Watts on Phase 1`,
                unit: `watts`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.w_l2`,
            type: `state`,
            common: {
                name: `Watts Phase 2`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Watts on Phase 2`,
                unit: `watts`
            },
            native: {}
        },
        {
            _id: `powermeter.${id}.w_l3`,
            type: `state`,
            common: {
                name: `Watts Phase 3`,
                type: `number`,
                role: `value`,
                read: true,
                write: false,
                desc: `Watts on Phase 3`,
                unit: `watts`
            },
            native: {}
        }
    ];
};

export const oldAPIStates: ioBroker.AnyObject[] = [
    {
        _id: `status.pacCharge`,
        type: `state`,
        common: {
            name: `Power AC Charge`,
            type: `number`,
            role: `value.pac`,
            read: true,
            write: false,
            desc: `Inverter AC Power charging`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.pacDischarge`,
        type: `state`,
        common: {
            name: `Power AC Discharge`,
            type: `number`,
            role: `value.pac`,
            read: true,
            write: false,
            desc: `Inverter AC Power discharging`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.operatingMode`,
        type: `state`,
        common: {
            name: `Operating Mode`,
            type: `number`,
            role: `status.operatingMode`,
            read: true,
            write: false,
            desc: `Operating Mode of the battery`,
            states: {
                10: `Standby in Auto-Mode`,
                11: `Conservation charge in Auto-Mode`,
                13: `Charging in Auto-Mode`,
                15: `Discharging in Auto-Mode`
            }
        },
        native: {}
    },
    {
        _id: `status.consumptionL1`,
        type: `state`,
        common: {
            name: `Consumption L1`,
            type: `number`,
            role: `value.consumption`,
            read: true,
            write: false,
            desc: `Consumption of L1`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.consumptionL2`,
        type: `state`,
        common: {
            name: `Consumption L2`,
            type: `number`,
            role: `value.consumption`,
            read: true,
            write: false,
            desc: `Consumption of L2`,
            unit: `watts`
        },
        native: {}
    },
    {
        _id: `status.consumptionL3`,
        type: `state`,
        common: {
            name: `Consumption L3`,
            type: `number`,
            role: `value.consumption`,
            read: true,
            write: false,
            desc: `Consumption of L3`,
            unit: `watts`
        },
        native: {}
    }
];
