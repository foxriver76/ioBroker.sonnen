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
        text += '<div id="soc"><p class="value" id="soc-value"></p></div>';
        text += '<div id="consumption"><p class="value" id="consumption-value"></p></div>';
        text += '<div id="production"><p class="value" id="production-value"></p></div>';
        text += '<div id="grid"><p class="value" id="grid-value"></p></div>';

        $('#' + widgetID).html(text);

        // subscribe on updates of value
        function onChange(obj, newVal, oldVal) {
            console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: objectChange ' + obj.type + ' - ' + newVal + ' - ' + oldVal);
            //$div.find('.template-value').html(newVal);
            const id = obj.type.split('.')[3];
            switch (id) {
                case 'userSoc':
                    $('#soc-value').text(newVal + ' %');
                    break;
                case 'consumption':
                    $('#consumption-value').text(newVal + ' W');
                    break;
                case 'production':
                    $('#production-value').text(newVal + ' W');
                    break;
                case 'gridFeedIn':
                    $('#grid-value').text(newVal + ' W');
                    break;
                case 'flowConsumptionBattery':
                case 'flowGridBattery':
                case 'flowConsumptionGrid':
                case 'flowProductionBattery':
                case 'flowConsumptionProduction':
                case 'flowProductionGrid':
                    // if one on the flows changed we have to cross check so do it everytime
                    if (!(vis.states['sonnen.0.status.flowConsumptionBattery.val'] || vis.states['sonnen.0.status.flowGridBattery.val'] ||
                        vis.states ['sonnen.0.status.flowProductionBattery.val'])) {
                        // no flow to battery disable line
                        $('.battery-line').hide();
                    } else {
                        $('.battery-line').show();
                    }

                    if (!(vis.states['sonnen.0.status.flowConsumptionBattery.val'] || vis.states['sonnen.0.status.flowConsumptionGrid.val'] ||
                        vis.states['sonnen.0.status.flowConsumptionProduction.val'])) {
                        // no consumption disable house line
                        $('.house-line').hide();
                    } else {
                        $('.house-line').show();
                    }

                    if (!(vis.states['sonnen.0.status.flowProductionBattery.val'] || vis.states['sonnen.0.status.flowProductionGrid.val'] ||
                        vis.states['sonnen.0.status.flowConsumptionProduction.val'])) {
                        // no production disable photovoltaics-line line
                        $('.photovoltaics-line').hide();
                    } else {
                        $('.photovoltaics-line').show();
                    }

                    if (!(vis.states['sonnen.0.status.flowGridBattery.val'] || vis.states['sonnen.0.status.flowProductionGrid.val'] ||
                        vis.states['sonnen.0.status.flowConsumptionGrid.val'])) {
                        // no grid disable photovoltaics-line line
                        $('.grid-line').hide();
                    } else {
                        $('.grid-line').show();
                    }
                    break;
                default:
                    console.error(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: objectChange unknown id: ' + id);
            }

        }

        const dps = [
            'sonnen.0.status.userSoc',
            'sonnen.0.status.consumption',
            'sonnen.0.status.production',
            'sonnen.0.status.gridFeedIn',
            'sonnen.0.status.flowConsumptionBattery',
            'sonnen.0.status.flowGridBattery',
            'sonnen.0.status.flowConsumptionGrid',
            'sonnen.0.status.flowProductionBattery',
            'sonnen.0.status.flowConsumptionProduction',
            'sonnen.0.status.flowProductionGrid'
        ];

        // Update states and subscribe to changes
        vis.conn.getStates(dps, function (error, states) {
            console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: Subscribing to state changes');
            vis.updateStates(states);
            vis.conn.subscribe(dps);

            // ad onChange listener
            for (let i = 0; i < dps.length; i++) {
                dps[i] = dps[i] + '.val';
                vis.states.bind(dps[i], onChange);
            } // endFor

            // give vis ability to destroy on change
            const $div = $('#' + widgetID);
            $div.data('bound', dps);
            $div.data('bindHandler', onChange);

            // set initial values
            $('#soc-value').text(states['sonnen.0.status.userSoc'].val + ' %');
            $('#consumption-value').text(states['sonnen.0.status.consumption'].val + ' W');
            $('#production-value').text(states['sonnen.0.status.production'].val + ' W');
            $('#grid-value').text(states['sonnen.0.status.gridFeedIn'].val + ' W');

            if (!(states['sonnen.0.status.flowConsumptionBattery'].val || states['sonnen.0.status.flowGridBattery'].val ||
            states ['sonnen.0.status.flowProductionBattery'].val)) {
                // no flow to battery disable line
                $('.battery-line').hide();
            }

            if (!(states['sonnen.0.status.flowConsumptionBattery'].val || states['sonnen.0.status.flowConsumptionGrid'].val ||
            states['sonnen.0.status.flowConsumptionProduction'].val)) {
                // no consumption disable house line
                $('.house-line').hide();
            }

            if (!(states['sonnen.0.status.flowProductionBattery'].val || states['sonnen.0.status.flowProductionGrid'].val ||
                states['sonnen.0.status.flowConsumptionProduction'].val)) {
                // no production disable photovoltaics-line line
                $('.photovoltaics-line').hide();
            }

            if (!(states['sonnen.0.status.flowGridBattery'].val || states['sonnen.0.status.flowProductionGrid'].val ||
                states['sonnen.0.status.flowConsumptionGrid'].val)) {
                // no grid disable photovoltaics-line line
                $('.grid-line').hide();
            }
        });
    }
};

vis.binds['sonnen'].showVersion();