#!/usr/bin/env node

'use strict'; // eslint-disable-line strict, lines-around-directive

const cli = require('../build/cli').default; // eslint-disable-line import/no-unresolved

cli(process.argv.slice(2));
