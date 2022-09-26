/// <reference types="iobroker" />
export declare const generalAPIStates: ioBroker.AnyObject[];
/**
 * API states which are not in general and are exlusive for v1
 */
export declare const apiStatesV1: ioBroker.AnyObject[];
/**
 * API states which are not in general and are exlusive for v1
 */
export declare const apiStatesV2: ioBroker.AnyObject[];
/**
 * Returns the powermeter states objects in an array
 *
 * @param id - powermeter id
 * @param direction - used as name of channel
 */
export declare const getPowermeterStates: (id: string, direction: string) => ioBroker.AnyObject[];
export declare const oldAPIStates: ioBroker.AnyObject[];
