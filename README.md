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
4. Now you can see the adapter configuration page --> type in the ip-address of your sonnen battery
5. Click on Save & Close

## Usage
Here you can find a description of the states and how to use them. The most states of this adapter are read-only states.

### States


## Changelog

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
