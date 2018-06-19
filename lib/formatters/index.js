/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Function} Formatter
 * @function
 * @param {object} object
 * @param {object} cliSettings
 */

/**
 * @typedef {Formatter} ResponseFormatter
 */

/**
 * @typedef {Formatter} ErrorFormatter
 */

/**
 * @typedef {Formatter} StatusFormatter
 */

/**
 * @typedef {Object} OutputFormatters
 * @property {ResponseFormatter} responseFormatter
 * @property {ErrorFormatter} errorFormatter
 * @property {StatusFormatter} statusFormatter
 */

const util = require('util');
const c = require('clorox');

/** @type OutputFormatters */
module.exports.default = {

    responseFormatter: response => util.inspect(response, {depth: 3}),

    errorFormatter: error => {
        let errText = '';
        if(error.errorType) {
            errText += 'Type: ' + error.errorType + '\n';
            if(error.error && error.error.message) {
                errText += 'Message: ' + error.error.message;
            } else {
                errText += util.inspect(error, {depth: 3});
            }
        } else {
            errText += util.inspect(error, {depth: 3});
        }
        return errText;
    },

    statusFormatter: (status, cliSettings) => {
        let out = [cliSettings.operation, ' ', cliSettings.service || cliSettings.file, ': '].join('');
        out += status === 'success'
               ? c.green('SUCCESS')
               : c.red('FAILED');
        return out;
    }
};

module.exports.resources = require('./resources');
module.exports.settings = require('./settings');
