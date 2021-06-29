/*
    ioBroker.vis template Widget-Set

    version: "0.0.1"

    Copyright 2021 Author author@mail.com
*/
'use strict';

// add translations for edit mode
$.extend(
    true,
    systemDictionary,
    {
        // Add your translations here, e.g.:
        // "size": {
        // 	"en": "Size",
        // 	"de": "Größe",
        // 	"ru": "Размер",
        // 	"pt": "Tamanho",
        // 	"nl": "Grootte",
        // 	"fr": "Taille",
        // 	"it": "Dimensione",
        // 	"es": "Talla",
        // 	"pl": "Rozmiar",
        // 	"zh-cn": "尺寸"
        // }
    }
);

// this code can be placed directly in sonnen.html
vis.binds['sonnen'] = {
    version: '0.0.1',
    showVersion: function () {
        if (vis.binds['sonnen'].version) {
            console.log('Version sonnen: ' + vis.binds['sonnen'].version);
            vis.binds['sonnen'].version = null;
        }
    },
    createWidget: function (widgetID, view, data, style) {
        console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: Trying to render widget');
        const $div = $('#' + widgetID);
        // if nothing found => wait
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['sonnen'].createWidget(widgetID, view, data, style);
            }, 100);
        }

        let text = '';
        text += '<div class="grid"><img src="widgets/sonnen/img/grid.svg" alt="grid" class="img"/></div>';
        text += '<div class="house"><img src="widgets/sonnen/img/house.svg" alt="house" class="img"/></div>';
        text += '<div class="battery"><img src="widgets/sonnen/img/battery.svg" alt="battery" class="img"/></div>';
        text += '<div class="photovoltaics"><img src="widgets/sonnen/img/photovoltaics.svg" alt="photovoltaics" class="img"/></div>';
        text += '<div class="photovoltaics-line"></div>';
        text += '<div class="house-line"></div>';
        text += '<div class="battery-line"></div>';
        text += '<div class="grid-line"></div>';

        $('#' + widgetID).html(text);

        // subscribe on updates of value
        function onChange(obj, newVal, oldVal) {
            console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: objectChange ' + JSON.stringify(obj) + ' - ' + newVal + ' - ' + oldVal);
            //$div.find('.template-value').html(newVal);
        }

        let dps = [
            'sonnen.0.status.userSoc',
            'sonnen.0.status.consumption',
            'sonnen.0.status.production',
            'sonnen.0.status.gridFeedIn',
            'sonnen.0.status.flowConsumptionBattery',
            'sonnen.0.status.flowGridBattery',
            'sonnen.0.status.flowConsumptionGrid',
            'sonnen.0.status.flowProductionBattery'
        ];

        // Update states and subscribe to changes
        vis.conn.getStates(dps, function (error, states) {
            console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: Subscribing to state changes');
            vis.updateStates(states);
            vis.conn.subscribe(dps);

            // ad onChange listener
            for (var i = 0; i < dps.length; i++) {
                dps[i] = dps[i] + '.val';
                vis.states.bind(dps[i], onChange);
            } // endFor

            // give vis ability to destroy on change
            var $div = $('#' + widgetID);
            $div.data('bound', dps);
            $div.data('bindHandler', onChange);
        });
    }
};

vis.binds['sonnen'].showVersion();