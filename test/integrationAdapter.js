'use strict';

const path = require('path');
const { tests } = require('@iobroker/testing');

// Run tests
tests.integration(path.join(__dirname, '..'));
