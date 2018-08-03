![Logo](admin/sonnen.png)
# ioBroker.sonnen
===========================

[![Build Status Travis](https://travis-ci.org/foxriver76/ioBroker.sonnen.svg?branch=master)](https://travis-ci.org/foxriver76/ioBroker.sonnen)[![Build status](https://ci.appveyor.com/api/projects/status/9c3a9qlw4ut32hbu/branch/master?svg=true)](https://ci.appveyor.com/project/foxriver76/iobroker-sonnen/branch/master)

[![NPM version](http://img.shields.io/npm/v/iobroker.sonnen.svg)](https://www.npmjs.com/package/iobroker.sonnen)
[![Downloads](https://img.shields.io/npm/dm/iobroker.sonnen.svg)](https://www.npmjs.com/package/iobroker.sonnen)

[![NPM](https://nodei.co/npm/iobroker.sonnen.png?downloads=true)](https://nodei.co/npm/iobroker.sonnen/)

## Installation
You can either install the adapter via the ioBroker web interface or on your local machine via npm.

### Browser-based
1. Open your ioBroker web interface in a browser (eg: 192.168.30.70:8081)
2. Click on Tab "Adapters"
3. Click on "Install from Github"
4. Click on "Custom"
5. Paste the URL "https://github.com/foxriver76/ioBroker.sonnen"
6. Click on the "Install" button

### Local machine
Navigate into your iobroker folder and execute the following command: 
```bash
npm i iobroker.sonnen
```

## Setup
Additional to the adapter installation you have to add an instance of the adapter.

### ioBroker 
1. Open your ioBroker interface in a browser (eg: 192.168.1.33:8081)
2. Navigate to Tab "Adapters"
3. Click on the three points and then on the "+" symbol of the sonnen adapter
![Add Adapter](/doc/addInstance.png)
4. Now you can see the main settings of the adapter configuration page --> type in the ip-address of your sonnen battery
![Main Settings](/doc/mainSettings.png)
5. If you want to thange the interval in which the states are polled, click on the tab "Advanced Settings"
6. You can set the poll interval between 2000 ms (2 seconds) and 60000 ms (1 minute), the default value is 7 seconds
![Advanced Settings](/doc/advancedSettings.png)
7. Click on Save & Close

## Usage
Here you can find a description of the states and how to use them. The most states of this adapter are read-only states.

### States

* info.connection

   *Read-only boolean which is true if the adapter is connected to the battery.*
   
* info.lastSync

   *Read-only timestamp w. r. t. the last successful synchronization time.*
   
* status.consumption

   *Read-only number, which represents the current consumption of your house in watts.*
   
* status.production

   *Read-only number, which represents the current production of you photovoltaics system in watts.*
   
* status.pacTotal

   *Read-only number, which represents the inverter AC Power in watts. If the value is greater than 0 the battery is discharging, if greather than zero it is charging.*
   
* status.relativeSoc

   *Read-only number, which represents the state of charge of your battery in percent.*
   
* status.userSoc

   *Read-only number, which represents the state of charge of your battery in percent.*
   
* status.acFrequency

   *Read-only number, which represents the AC Frequency in hertz.*
   
* status.acVoltage

   *Read-only number, which represents the current AC voltage of your inverter.*
   
* status.batteryVoltage

   *Read-only number, which represents the current DC voltage of the battery.*
   
* status.systemTime

   *Read-only ISO date, which represents the system time of your battery.*
   
* status.systemInstalled

   *Read-only boolean indicator. True if system is installed otherwise false.*
   
* status.batteryCharging

   *Read-only boolean indicator. True if battery is charging, otherwise false.*
   
* status.flowConsumptionBattery

   *Read-only boolean indicator. True if you are consuming from battery, otherwise false.*
   
* status.flowConsumptionGrid

   *Read-only boolean indicator. True if you are consuming from grid, otherwise false.*
   
* status.flowConsumptionProduction

   *Read-only boolean indicator. True if you are consuming from your current production, otherwise false.*
   
* status.flowGridBattery

   *Read-only boolean indicator. True if grid charges battery, otherwise false.*
   
* status.flowProductionBattery

   *Read-only boolean indicator. True if production charges battery, otherwise false.*
   
* status.flowProductionGrid

   *Read-only boolean indicator. True if production flows into grid, otherwise false.*
   
* status.gridFeedIn

   *Read-only number, which represents the amount of watts consuming from or feeding in grid. If the number is positive you are feeding the grid, if negative you are consuming from grid.*
   
* control.charge

   *Number-value which allows you to control the charging rate of the battery in watts. If you set garbage here it will also be acknowledged, because acknowldging just means that the battery received your command.*
   
   *Example:*
    ```javascript
    setState('sonnen.0.control.charge', 1250); // Do not charge more than 1250 watts
    ```
   
* control.discharge

   *Number-value which allows you to control the discharging rate of the battery in watts. If you set garbage here it will also be acknowledged, because acknowldging just means that the battery received your command.*
   
   *Example:*
    ```javascript
    setState('sonnen.0.control.discharge', 1250); // Do not discharge more than 1250 watts
    ```

## Changelog

### 0.0.2
* (foxriver76) bugfixes on control states
* (foxriver76) big readme update
* (foxriver76) addded more states
* (foxriver76) added advanced settings

### 0.0.1
* (foxriver76) initial release

## License
The MIT License (MIT)

Copyright (c) 2018 Moritz Heusinger <moritz.heusinger@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
