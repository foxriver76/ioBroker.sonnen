/**
 * sonnen adapter
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

// you have to require the utils module and call adapter function
const utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
const adapter = new utils.Adapter('sonnen');

// when adapter shuts down
adapter.on('unload', callback => {
    try {
        adapter.log.info('Stop sonnen adapter...');
        callback();
    } catch (e) {
        callback();
    }
});




// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', obj => {
    if (typeof obj === 'object' && obj.message) {
        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
adapter.on('ready', () => {
    if(adapter.config.ip) {
    	adapter.log.info('Starting sonnen adapter');
    	main();
    } else adapter.log.warn('No IP-address set');
});

function main() {
	// Vars
	const ip = adapter.config.ip;

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    adapter.log.info('config ip: '    + ip);
    
    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
    	// TODO: Control charge & discharge
    });

    // all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    adapter.getForeignObject(adapter.namespace, (err, obj) => { // create device namespace
        if (!obj) {
            adapter.setForeignObject(adapter.namespace, {
                type: 'device',
                common: {
                    name: 'sonnen device'
                }
            });
        } // endIf
    });
    
    
} // endMain
