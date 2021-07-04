/*
    ioBroker.vis sonnen Widget-Set

    version: "0.0.1"

    Copyright 2021 Moritz Heusinger moritz.heusinger@gmail.com
*/
'use strict';

// add translations for edit mode
$.extend(
    true,
    systemDictionary,
    {
        // Add your translations here, e.g.:
        'sonnenMainColor': {
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
        },
        'sonnenInstance': {
            'en': 'adapter instance',
            'de': 'Adapterinstanz',
            'ru': 'экземпляр адаптера',
            'pt': 'instância do adaptador',
            'nl': 'adapter instantie',
            'fr': "instance d'adaptateur",
            'it': "istanza dell'adattatore",
            'es': 'instancia de adaptador',
            'pl': 'instancja adaptera',
            'zh-cn': '适配器实例'
        },
        'sonnenStrokeWidth': {
            'en': 'stroke width in px',
            'de': 'Strichstärke in px',
            'ru': 'ширина штриха в пикселях',
            'pt': 'largura do traço em px',
            'nl': 'lijnbreedte in px',
            'fr': 'largeur de trait en px',
            'it': 'larghezza del tratto in px',
            'es': 'ancho del trazo en px',
            'pl': 'szerokość obrysu w pikselach',
            'zh-cn': '以 px 为单位的描边宽度'
        }
    }
);

// this code can be placed directly in sonnen.html
vis.binds['sonnen'] = {
    createWidget: function (widgetID, view, data, style) {
        let mainColor = data._data.sonnenMainColor || '#181A27';
        let instance = data._data.sonnenInstance || 'sonnen.0';
        let strokeWidth = !isNaN(parseInt(data._data.sonnenStrokeWidth)) ? data._data.sonnenStrokeWidth + 'px' : '8px';
        let halfStrokeWidth = parseInt(strokeWidth) / 2 + 'px';

        console.log(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: Trying to render widget');
        let $div = $('#' + widgetID);
        // if nothing found => wait
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['sonnen'].createWidget(widgetID, view, data, style);
            }, 100);
        }

        let text = '';
        text += '<div id="sonnen-grid"><svg class="sonnen-img" xmlns="http://www.w3.org/2000/svg" width="31" height="33" viewBox="0 0 31 33">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linecap="round" stroke-linejoin="round">\n' +
            '        <path d="M.5 32.5h30M25 32.5L18.523.5h-5.858L6 32.5M19.379 3.5H26.5M4.5 3.5H12M21 11.5h4.5M5.508 11.5H10"/>\n' +
            '        <path d="M19.5 6.5l-9.5 9 14 13"/>\n' +
            '        <path d="M11.5 6.5l9.5 9-14 13"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div id="sonnen-house"><svg class="sonnen-img" xmlns="http://www.w3.org/2000/svg" width="37" height="31" viewBox="0 0 37 31">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linecap="round" stroke-linejoin="round">\n' +
            '        <path d="M36.204 12.656L18.602.463 1 12.656"/>\n' +
            '        <path d="M6.5 9v21.5h4v-12h8v12h12V9"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div id="sonnen-battery"><svg class="sonnen-img" xmlns="http://www.w3.org/2000/svg" width="29" height="31" viewBox="0 0 29 31">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '">\n' +
            '        <rect width="28" height="30" x=".5" y=".5" rx="1"/>\n' +
            '        <path stroke-width=".9" d="M14.5 13.5c1.678 0 3.039-1.343 3.039-3s-1.36-3-3.039-3c-1.678 0-3.039 1.343-3.039 3s1.36 3 3.039 3z"/>\n' +
            '        <path stroke-linecap="round" d="M10.5 16.5h8"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div id="sonnen-photovoltaics"><svg class="sonnen-img" xmlns="http://www.w3.org/2000/svg" width="43" height="28" viewBox="0 0 43 28">\n' +
            '    <g fill="none" fill-rule="evenodd" stroke="' + mainColor + '" stroke-linejoin="round">\n' +
            '        <path d="M36.5.5h-30l-6 22h42z"/>\n' +
            '        <path stroke-width=".5" d="M21.5.5v22M12.5.5l-3 22M30.5.5l3 22"/>\n' +
            '        <path stroke-linecap="round" stroke-width=".5" d="M5.496 6h32.008M3.5 13h36"/>\n' +
            '        <path stroke-linecap="round" d="M31.5 22.602V27.5M11.5 22.5v5"/>\n' +
            '    </g>\n' +
            '</svg>\n</div>';
        text += '<div id="sonnen-photovoltaics-line"> <svg height="100%" width="5000">\n' +
            '  <line id="sonnen-photovoltaics-line-svg" class="sonnen-line-svg" x1="0" y1="0" x2="0" y2="5000" />\n' +
            '</svg> </div>';
        text += '<div id="sonnen-house-line"> <svg height="100%" width="5000">\n' +
            '  <line id="sonnen-house-line-svg" class="sonnen-line-svg" x1="0" y1="0" x2="0" y2="5000" />\n' +
            '</svg> </div>';
        text += '<div id="sonnen-battery-line"> <svg height="5000" width="100%">\n' +
            '  <line id="sonnen-battery-line-svg" class="sonnen-line-svg" x1="0" y1="0" x2="5000" y2="0" />\n' +
            '</svg> </div>';
        text += '<div id="sonnen-grid-line"> <svg height="5000" width="100%">\n' +
            '  <line id="sonnen-grid-line-svg" class="sonnen-line-svg" x1="0" y1="0" x2="5000" y2="0" />\n' +
            '</svg> </div>';
        text += '<div class="sonnen-soc"><p class="sonnen-value" id="sonnen-soc-value"></p></div>';
        text += '<div class="sonnen-consumption"><p class="sonnen-value" id="sonnen-consumption-value"></p></div>';
        text += '<div class="sonnen-production"><p class="sonnen-value" id="sonnen-production-value"></p></div>';
        text += '<div class="sonnen-grid"><p class="sonnen-value" id="sonnen-grid-value"></p></div>';
        text += '<div class="sonnen-pac"><p class="sonnen-value" id="sonnen-pac-value"></p></div>';

        $div.html(text);

        // cache all jQuery selectors
        let $sonnenGridLineSvg = $('#sonnen-grid-line-svg');
        let $sonnenBatteryLineSvg = $('#sonnen-battery-line-svg');
        let $sonnenPhotovoltaicsLine = $('#sonnen-photovoltaics-line');
        let $sonnenHouseLine = $('#sonnen-house-line');
        let $sonnenBatteryLine = $('#sonnen-battery-line');
        let $sonnenGridLine = $('#sonnen-grid-line');
        let $sonnenSocValue = $('#sonnen-soc-value');
        let $sonnenConsumptionValue = $('#sonnen-consumption-value');
        let $sonnenProductionValue = $('#sonnen-production-value');
        let $sonnenGridValue = $('#sonnen-grid-value');
        let $sonnenPacValue = $('#sonnen-pac-value');

        // subscribe on updates of value, we can use obj, newVal, oldVal
        function onChange(obj, newVal) {
            let id = obj.type.split('.')[3];
            switch (id) {
                case 'userSoc':
                    $sonnenSocValue.text(newVal + ' %');
                    break;
                case 'consumption':
                    $sonnenConsumptionValue.text(newVal + ' W');
                    break;
                case 'production':
                    $sonnenProductionValue.text(newVal + ' W');
                    break;
                case 'gridFeedIn':
                    $sonnenGridValue.text(newVal + ' W');
                    if (parseInt(newVal) > 0) {
                        // positive means we are feeding in
                        $sonnenGridLineSvg.css('animation', 'sonnen-dash 10s linear reverse infinite');
                    } else {
                        $sonnenGridLineSvg.css('animation', 'sonnen-dash 10s linear infinite');
                    }
                    break;
                case 'pacTotal':
                    $sonnenPacValue.text(newVal + ' W');
                    break;
                case 'batteryCharging':
                    if (newVal) {
                        $sonnenBatteryLineSvg.css('animation', 'sonnen-dash 10s linear infinite');
                    } else {
                        $sonnenBatteryLineSvg.css('animation', 'sonnen-dash 10s reverse linear infinite');
                    }
                    break;
                case 'flowConsumptionBattery':
                case 'flowGridBattery':
                case 'flowConsumptionGrid':
                case 'flowProductionBattery':
                case 'flowConsumptionProduction':
                case 'flowProductionGrid':
                    // if one on the flows changed we have to cross check so do it everytime
                    if (!(vis.states[instance + '.status.flowConsumptionBattery.val'] || vis.states[instance + '.status.flowGridBattery.val'] ||
                        vis.states [instance + '.status.flowProductionBattery.val'])) {
                        // no flow to battery disable line
                        $sonnenBatteryLine.hide();
                    } else {
                        $sonnenBatteryLine.show();
                    }

                    if (!(vis.states[instance + '.status.flowConsumptionBattery.val'] || vis.states[instance + '.status.flowConsumptionGrid.val'] ||
                        vis.states[instance + '.status.flowConsumptionProduction.val'])) {
                        // no consumption disable house line
                        $sonnenHouseLine.hide();
                    } else {
                        $sonnenHouseLine.show();
                    }

                    if (!(vis.states[instance + '.status.flowProductionBattery.val'] || vis.states[instance + '.status.flowProductionGrid.val'] ||
                        vis.states[instance + '.status.flowConsumptionProduction.val'])) {
                        // no production disable photovoltaics-line line
                        $sonnenPhotovoltaicsLine.hide();
                    } else {
                        $sonnenPhotovoltaicsLine.show();
                    }

                    if (!(vis.states[instance + '.status.flowGridBattery.val'] || vis.states[instance + '.status.flowProductionGrid.val'] ||
                        vis.states[instance + '.status.flowConsumptionGrid.val'])) {
                        // no grid disable photovoltaics-line line
                        $sonnenGridLine.hide();
                    } else {
                        $sonnenGridLine.show();
                    }
                    break;
                default:
                    console.error(new Date().toLocaleTimeString() + ' sonnen[' + widgetID + ']: objectChange unknown id: ' + id);
            }

        }

        let dps = [
            instance + '.status.userSoc',
            instance + '.status.consumption',
            instance + '.status.production',
            instance + '.status.gridFeedIn',
            instance + '.status.pacTotal',
            instance + '.status.flowConsumptionBattery',
            instance + '.status.flowGridBattery',
            instance + '.status.flowConsumptionGrid',
            instance + '.status.flowProductionBattery',
            instance + '.status.flowConsumptionProduction',
            instance + '.status.flowProductionGrid',
            instance + '.status.batteryCharging'
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
            $div.data('bound', dps);
            $div.data('bindHandler', onChange);

            // set configured stroke width
            $sonnenPhotovoltaicsLine.css('width', strokeWidth);
            $sonnenPhotovoltaicsLine.css('left', 'calc(50% - '+ halfStrokeWidth + ')');

            $sonnenHouseLine.css('width', strokeWidth);
            $sonnenHouseLine.css('left', 'calc(50% - '+ halfStrokeWidth + ')');

            $sonnenBatteryLine.css('height', strokeWidth);
            $sonnenBatteryLine.css('bottom', 'calc(50% - '+ halfStrokeWidth + ')');

            $sonnenGridLine.css('height', strokeWidth);
            $sonnenGridLine.css('bottom', 'calc(50% - '+ halfStrokeWidth + ')');

            // set initial values
            $sonnenSocValue.text(states[instance + '.status.userSoc'].val + ' %');
            $sonnenConsumptionValue.text(states[instance + '.status.consumption'].val + ' W');
            $sonnenProductionValue.text(states[instance + '.status.production'].val + ' W');
            $sonnenGridValue.text(states[instance + '.status.gridFeedIn'].val + ' W');
            $sonnenPacValue.text(states[instance + '.status.pacTotal'].val + ' W');
            // change color
            $('.sonnen-value').css('color', mainColor);

            if (!(states[instance + '.status.flowConsumptionBattery'].val || states[instance + '.status.flowGridBattery'].val ||
            states [instance + '.status.flowProductionBattery'].val)) {
                // no flow to battery disable line
                $sonnenBatteryLine.hide();
            }

            if (!(states[instance + '.status.flowConsumptionBattery'].val || states[instance + '.status.flowConsumptionGrid'].val ||
            states[instance + '.status.flowConsumptionProduction'].val)) {
                // no consumption disable house line
                $sonnenHouseLine.hide();
            }

            if (!(states[instance + '.status.flowProductionBattery'].val || states[instance + '.status.flowProductionGrid'].val ||
                states[instance + '.status.flowConsumptionProduction'].val)) {
                // no production disable photovoltaics-line line
                $sonnenPhotovoltaicsLine.hide();
            }

            if (!(states[instance + '.status.flowGridBattery'].val || states[instance + '.status.flowProductionGrid'].val ||
                states[instance + '.status.flowConsumptionGrid'].val)) {
                // no grid disable photovoltaics-line line
                $sonnenGridLine.hide();
            }

            // now add the animations
            if (states[instance + '.status.batteryCharging'].val) {
                $sonnenBatteryLineSvg.css('animation', 'sonnen-dash 10s linear infinite');
            } else {
                $sonnenBatteryLineSvg.css('animation', 'sonnen-dash 10s reverse linear infinite');
            }

            if (parseInt(states[instance + '.status.gridFeedIn'].val) > 0) {
                // positive means we are feeding in
                $sonnenGridLineSvg.css('animation', 'sonnen-dash 10s linear reverse infinite');
            } else {
                $sonnenGridLineSvg.css('animation', 'sonnen-dash 10s linear infinite');
            }
        });
    }
};