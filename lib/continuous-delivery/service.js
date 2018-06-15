/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Object} Service
 * @extends NamedObject
 * @property {string} name - Name of the service
 * @property {string} type - Type of service - 'xUML', 'node', 'java'
 * @property {string} repository - Relative path to the service's repository
 * @property {Object.<string,Array.<GuardedSettingValue>>} settings
 */

/**
 * @typedef {Object} GuardedSettingValue
 * @property {Array.<string>} domain
 * @property {Array.<string>} label
 * @property {Array.<string>} node
 * @property {string} value
 */

/**
 * @typedef {Object} ServiceLike
 * @property {string} type - Type of service - 'xUML', 'node', 'java'
 * @property {string} repository - Relative path to the service's repository
 * @property {?Object.<string,Array.<GuardedSettingValueLike|string>>} settings
 */

/**
 * @typedef {Object} GuardedSettingValueLike
 * @property {?string|Array.<string>} domain
 * @property {?string|Array.<string>} label
 * @property {?string|Array.<string>} node
 * @property {?string} value
 */

const util = require('./util');
const path = require('path');

const SERVICE_TYPES = Object.freeze(['xUML', 'node', 'java']);

/**
 * Brings service-like object to a canonical representation
 * @param {ServiceLike} service
 * @param {string} configRoot Root directory of the configuration
 * @returns {Service} Service in canonical form
 */
function normalize(service, configRoot) {
    return {
        name: '',
        type: validateType(service.type),
        repository: checkRepository(service.repository, configRoot),
        settings: normalizeSettingsValue(service.settings)
    };
}

/**
 * Check if given service type is valid
 * @param {string} type Type to check
 * @returns {string} Valid type
 */
function validateType(type) {
    if(!SERVICE_TYPES.includes(type)) {
        throw new TypeError(`Service type '${type}' is unknown. Use one of '${SERVICE_TYPES.join("','")}'`);
    }
    return type;
}

/**
 * Check if repository is given and is of right type
 * @param {string} value Value to check
 * @param {string} configRoot Root directory of the configuration
 * @returns {string} Valid value
 */
function checkRepository(value, configRoot) {
    if(!value || typeof value !== 'string') {
        throw new TypeError('Missing \'repository\' field.');
    }
    return path.resolve(configRoot, 'repositories', value);
}

/**
 * Brings settings-like array to canonical representation
 * @param {?Object.<string,Array.<GuardedSettingValueLike|string>>} settings
 * @returns {Object.<string,Array.<GuardedSettingValue>>}
 */
function normalizeSettingsValue(settings) {
    if(!settings) {
        return {};
    }

    const result = {};
    Object.entries(settings).forEach(([key, value]) => {
        result[key] = normalizeSettingValues(value);
    });
    return result;
}

/**
 * Brings settings-like array to canonical representation
 * @param {?Array.<GuardedSettingValueLike|string>|string} values
 * @returns {Array.<GuardedSettingValue>}
 */
function normalizeSettingValues(values) {

    if(typeof values === 'string') {
        values = [values];
    }

    return values.map(v => normalizeSettingValue(v));
}

/**
 * Brings settings-like array to canonical representation
 * @param {?GuardedSettingValueLike|string} value
 * @returns {GuardedSettingValue}
 */
function normalizeSettingValue(value) {

    /** @type GuardedSettingValue **/
    const defaultValue = {
        domain: [],
        label: [],
        node: [],
        value: ''
    };

    if(typeof value === 'string') {
        return Object.assign({}, defaultValue, {value});
    }

    const allowedKeys = Object.keys(defaultValue);
    return Object.keys(value)
        .filter(key => allowedKeys.includes(key))
        .reduce((obj, key) => {
            if(key !== 'value') {
                obj[key] = util.makeStringArray(value[key]);
            } else {
                obj[key] = value[key];
            }
            return obj;
        }, Object.assign({}, defaultValue));
}

module.exports.normalize = normalize;
module.exports.validateType = validateType;
module.exports.normalizeSettingsValue = normalizeSettingsValue;
module.exports.normalizeSettingValues = normalizeSettingValues;
module.exports.normalizeSettingValue = normalizeSettingValue;
