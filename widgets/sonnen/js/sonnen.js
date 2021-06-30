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
        'mainColor': {
            'en': 'primary color',
            'de': 'Primärfarbe',
            'ru': 'Основной цвет',
            'pt': 'cor primária',
            'nl': 'primaire kleur',
            'fr': 'couleur primaire',
            'it': 'colore primario',
            'es': 'color primario',
            'pl': 'kolor podstawowy',
            'zh-cn': '原色'
        }
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
        let mainColor = data._data.mainColor || '#181A27';
        console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: Trying to render widget');
        let $div = $('#' + widgetID);
        // if nothing found => wait
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['sonnen'].createWidget(widgetID, view, data, style);
            }, 100);
        }

        let text = '';
        text += '<div class="grid"><svg class="img" xmlns="http://www.w3.org/2000/svg" width="31" height="33" viewBox="0 0 31 33">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linecap="round" stroke-linejoin="round">\n' +
            '        <path d="M.5 32.5h30M25 32.5L18.523.5h-5.858L6 32.5M19.379 3.5H26.5M4.5 3.5H12M21 11.5h4.5M5.508 11.5H10"/>\n' +
            '        <path d="M19.5 6.5l-9.5 9 14 13"/>\n' +
            '        <path d="M11.5 6.5l9.5 9-14 13"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div class="house"><svg class="img" xmlns="http://www.w3.org/2000/svg" width="37" height="31" viewBox="0 0 37 31">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linecap="round" stroke-linejoin="round">\n' +
            '        <path d="M36.204 12.656L18.602.463 1 12.656"/>\n' +
            '        <path d="M6.5 9v21.5h4v-12h8v12h12V9"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div class="battery"><svg class="img" xmlns="http://www.w3.org/2000/svg" width="29" height="31" viewBox="0 0 29 31">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '">\n' +
            '        <rect width="28" height="30" x=".5" y=".5" rx="1"/>\n' +
            '        <path stroke-width=".9" d="M14.5 13.5c1.678 0 3.039-1.343 3.039-3s-1.36-3-3.039-3c-1.678 0-3.039 1.343-3.039 3s1.36 3 3.039 3z"/>\n' +
            '        <path stroke-linecap="round" d="M10.5 16.5h8"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div class="photovoltaics"><svg class="img" xmlns="http://www.w3.org/2000/svg" width="43" height="28" viewBox="0 0 43 28">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linejoin="round">\n' +
            '        <path d="M36.5.5h-30l-6 22h42z"/>\n' +
            '        <path stroke-width=".5" d="M21.5.5v22M12.5.5l-3 22M30.5.5l3 22"/>\n' +
            '        <path stroke-linecap="round" stroke-width=".5" d="M5.496 6h32.008M3.5 13h36"/>\n' +
            '        <path stroke-linecap="round" d="M31.5 22.602V27.5M11.5 22.5v5"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
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
            let id = obj.type.split('.')[3];
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

        let dps = [
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
            let $div = $('#' + widgetID);
            $div.data('bound', dps);
            $div.data('bindHandler', onChange);

            // set initial values
            $('#soc-value').text(states['sonnen.0.status.userSoc'].val + ' %');
            $('#consumption-value').text(states['sonnen.0.status.consumption'].val + ' W');
            $('#production-value').text(states['sonnen.0.status.production'].val + ' W');
            $('#grid-value').text(states['sonnen.0.status.gridFeedIn'].val + ' W');
            // change color
            $('.value').css('color', mainColor);

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