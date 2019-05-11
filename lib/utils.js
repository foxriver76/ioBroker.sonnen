'use strict';

const newAPIStates = [
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
            type: `timestamp`,
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
            desc: `Configuration of your sonnen battery as JSON`,
            unit: ``
        },
        native: {}
    }
];

const oldAPIStates = [
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
                "10": `Standby in Auto-Mode`,
                "11": `Conservation charge in Auto-Mode`,
                "13": `Charging in Auto-Mode`,
                "15": `Discharging in Auto-Mode`
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

module.exports = {
    newAPIStates,
    oldAPIStates
};
