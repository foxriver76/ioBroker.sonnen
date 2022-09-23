/// <reference types="iobroker" />
export declare const newAPIStates: ioBroker.AnyObject[];
/**
 * Returns the powermeter states objects in an array
 *
 * @param id - powermeter id
 * @param direction - used as name of channel
 */
export declare const getPowermeterStates: (id: string, direction: string) => ioBroker.AnyObject[];
export declare const oldAPIStates: ioBroker.AnyObject[];
