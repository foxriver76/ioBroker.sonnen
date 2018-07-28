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
const req = require('xmlhttprequest')

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
	const pollingTime = 30000;
	const xmlhttp = new req.XMLHttpRequest();
	
	const statusUrl = ip + ':8080/api/status'; // Status Path - api/status --> GET

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    adapter.log.info('config ip: '    + ip);
    
    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
    	// TODO: Control charge & discharge
    });
    
    let polling = setInterval(() => { // poll states every 30 seconds
    	xmlhttp.open("GET", statusUrl, true);
    	xmlhttp.send();
	}, pollingTime);
    
    xmlhttp.onreadystatechange = () => { 
        if (this.readyState == 4 && this.status == 200) {
        	adapter.setState('info.connection', true, true);
        	let response = JSON.parse(this.responseText);
        	adapter.log.info('[RESPONSE] <== Received ' + response);
        } else {
        	adapter.setState('info.connection', false, true);
        	adapter.log.warn('[RESPONSE] <== Could not get a valid response');
        } // endElse

    };

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
