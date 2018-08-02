/**
 * sonnen adapter
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
const adapter = new utils.Adapter('sonnen');
const request = require('request');

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
	const pollingTime = 8000;
	const statusUrl = 'http://' + ip + ':8080/api/v1/status'; // Status Path - api/status --> GET

    adapter.log.debug('Started Adapter with: ' + ip);
    
    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
    	// TODO: Control charge & discharge
    });
    
    request(statusUrl, (error, response, body) => { // poll states on start
		  if(error) adapter.log.warn('[REQUEST] <== ' + error);
		  if(response && response.statusCode.toString() === '200') {
			  adapter.getState('info.connection', (obj, err) => {
				  if(!obj || !obj.val) {
					  adapter.setState('info.connection', true, true);
					  adapter.log.debug('[CONNECT] Connection successful established');
				  } // endIf
			  });
		  } else {
			  adapter.setState('info.connection', false, true);
			  adapter.log.warn('[CONNECT] Connection failed');	  
		  }// endElse
		  setBatteryStates(JSON.parse(body));
	});
    
    let polling = setInterval(() => { // poll states every [30] seconds
    	request(statusUrl, (error, response, body) => {
    		if(error) adapter.log.warn('[REQUEST] <== ' + error);
    		if(response && response.statusCode.toString() === '200') {
    			adapter.getState('info.connection', (obj, err) => {
    				if(!obj || !obj.val) {
    					adapter.setState('info.connection', true, true);
    					adapter.log.debug('[CONNECT] Connection successful established');
    				} // endIf
    			});
    		} else {
    			  adapter.setState('info.connection', false, true);
    			  adapter.log.warn('[CONNECT] Connection failed');
    		}// endElse
    		  setBatteryStates(JSON.parse(body));
    	});
	}, pollingTime);

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
    
    /*
     * Internals
     */
    function setBatteryStates(json) {
    	adapter.setState('info.lastSync', new Date().toISOString(), true);
    	adapter.setState('status.consumption', json.Consumption_W, true);
    	adapter.setState('status.batteryCharging', json.BatteryCharging, true);
    	adapter.setState('status.production', json.Production_W, true);
    	adapter.setState('status.pacTotal', json.Pac_total_W, true);
    	adapter.setState('status.relativeSoc', json.RSOC, true);
    	adapter.setState('status.userSoc', json.USOC, true);
    	adapter.setState('status.acFrequency', json.Fac, true);
    	adapter.setState('status.acVoltage', json.Uac, true);
    	adapter.setState('status.batteryVoltage', json.Ubat, true);
    	adapter.setState('status.systemTime', new Date(json.Timestamp).toISOString(), true);
    	if(json.IsSystemInstalled === 1) adapter.setState('status.systemInstalled', true, true)
    	else adapter.setState('status.systemInstalled', false, true);  	 	
    } // endSetBatteryStates
    
} // endMain
