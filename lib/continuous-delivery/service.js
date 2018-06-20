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
 * @property {Object.<string,Array.<GuardedValue>>} settings
 * @property {Object.<string,Array.<GuardedValue>>} preferences
 */

/**
 * @typedef {Object} GuardedValue
 * @property {Array.<string>} domain
 * @property {Array.<string>} label
 * @property {Array.<string>} node
 * @property {string} value
 */

/**
 * @typedef {Object} ServiceLike
 * @property {string} type - Type of service - 'xUML', 'node', 'java'
 * @property {string} repository - Relative path to the service's repository
 * @property {?Object.<string,Array.<GuardedValueLike|string>|string>} settings
 * @property {?Object.<string,Array.<GuardedValueLike|string>|string>} preferences
 */

/**
 * @typedef {Object} GuardedValueLike
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
        settings: normalizeHashOfGuardedValues(service.settings),
        preferences: normalizeHashOfGuardedValues(service.preferences),
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
 * Brings hash of guarded values to canonical representation
 * @param {?Object.<string,Array.<GuardedValueLike|*>|*>} values
 * @returns {Object.<string,Array.<GuardedValue>>}
 */
function normalizeHashOfGuardedValues(values) {
    if(!values) {
        return {};
    }

    const result = {};
    Object.entries(values).forEach(([k, v]) => {
        result[k] = normalizeGuardedValues(v);
    });
    return result;
}

/**
 * Brings array of guarded values to canonical representation
 * @param {?Array.<GuardedValueLike|*>|*} values
 * @returns {Array.<GuardedValue>}
 */
function normalizeGuardedValues(values) {

    if(!Array.isArray(values)) {
        values = [values];
    }

    return values.map(v => normalizeGuardedValue(v));
}

/**
 * Brings guarded value to canonical representation
 * @param {?GuardedValueLike|*} value
 * @returns {GuardedValue}
 */
function normalizeGuardedValue(value) {

    /** @type GuardedValue **/
    const defaultValue = {
        domain: [],
        label: [],
        node: [],
        value: ''
    };

    if(typeof value !== 'object') {
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
module.exports.normalizeHashOfGuardedValues = normalizeHashOfGuardedValues;
module.exports.normalizeGuardedValues = normalizeGuardedValues;
module.exports.normalizeGuardedValue = normalizeGuardedValue;