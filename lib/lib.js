'use strict';

const E2EBridge = require('e2e-bridge-lib');
const path = require('path');
const fs = require('fs');
const fmt = require('./formatters');

const XUML_SERVICE_TYPE = 'xUML';
const NODE_SERVICE_TYPE = 'node';
const JAVA_SERVICE_TYPE = 'java';

const GENERAL_RESOURCE_TYPE = 'resource';
const JAVA_RESOURCE_TYPE = 'java';
const XSLT_RESOURCE_TYPE = 'xslt';

const operations = Object.freeze({
    START: "start",
    STOP: "stop",
    KILL: "kill",
    REMOVE: "remove",
    DEPLOY: "deploy",
    PACK: "pack",
    SETTINGS: "settings",
    PREFERENCES: "preferences",
    MODELNOTES: "modelnotes",
    CUSTOMNOTES: "customnotes",
    SERVICES: "services",
    STATUS: "status",
    INFO: "info",
    SESSIONS: "sessions",
    CANCEL_SESSION: "cancel-session",
    RESOURCES: "resources",
    JAVA_RESOURCES: "java-resources",
    XSLT_RESOURCES: "xslt-resources",
    VARIABLES: "variables",
    REPOSITORY: "repository",
    DELIVER: "deliver",
});
module.exports.operations = operations;

function helpText(message) {

    let help = '';

    if(message) {
        help = message + '\n';
    }

    help +=
        'Usage:\n' +
        'services [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'java-resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'xslt-resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'variables [Bridge connection]\n' +
        'start|stop|remove ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'kill ${ServiceName} [Bridge connection]\n' +
        'status ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'info ${ServiceName} [Bridge connection]\n' +
        'sessions ${ServiceName} [Bridge connection]\n' +
        'cancel-session ${ServiceName} ${SessionId} [Bridge connection]\n' +
        'deploy [${path/to/repository}|${path/to/directory}] [Bridge connection] [-o deployment option]...\n' +
        'pack [${path/to/directory}] [${path/to/repository}] [-g|--git]\n' +
        'preferences ${ServiceName} [[-n|--nodejs]|[-j|--java]] [pref ${PreferenceName} ${PreferenceValue}]... [Bridge connection]\n' +
        'settings ${ServiceName} [-n|--nodejs] [set ${SettingsName} ${SettingValue}]... [Bridge connection]\n' +
        'modelnotes ${ServiceName} [${NotesFileName}] [Bridge connection]\n' +
        'customnotes ${ServiceName} [[${OutputFile}]|[--upload ${InputFile}]] [Bridge connection]\n' +
        'repository ${ServiceName} [${Destination}] [Bridge connection]\n' +
        '--help\n\n' +
        'Bridge connection:\n' +
        '\t-h|--host <FQDN Bridge host> The host, that runs the Bridge. Defaults to localhost.\n' +
        '\t-p|--port <Bridge port> The port of the Bridge. Defaults to 8080.\n' +
        "\t-u|--user <Bridge user> User that has the right to perform the selected operation on the Bridge.\n" +
        "\t\tRequired. If not given, you'll be prompted for it.\n" +
        "\t-P|--password <password for Bridge user> Password for the user.\n" +
        "\t\tRequired. If not given, you'll be prompted for it, what is recommended as giving your password\n" +
        "\t\tin command line will expose it in your shell's history. Password is masked during prompt.\n\n" +
        'Deployment options:\n' +
        '\tstartup|overwrite|overwritePrefs Multiple options can be separated by comma, like: "-o startup,overwrite"+\n' +
        '\t\tstartup: Launch service after deployment.\n' +
        '\t\toverwrite: Overwrite existing service if one already exists.\n' +
        '\t\toverwritePrefs: Overwrite settings and preferences too.\n' +
        "\t\tnpmInstall: Run 'npm install' (Applies to Node.js services only).\n" +
        "\t\trunScripts: Run 'npm install' (running scripts too) (Applies to Node.js services only).\n" +
        "\tinstanceName=<instance name>: Choose a different instance name  (applies to Node.js services only)\n\n" +
        "\tpreserveNodeModules: Do not delete the 'node_modules' directory when re-deploying node service\n\n" +
        'Other:\n' +
        '\t-n|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".\n\n\n' +
        '\t-j|--java Assume that the service is a Java service.\n\n\n' +
        '\t-g|--git Use "git archive" for building the repository. This is ignored for all commands but "pack".\n\n\n';

    return help;
}

module.exports.helpText = helpText;

function incorrectNbOfArgs() {
    return helpText('Incorrect number of arguments');
}

function unknownOp(op) {
    return helpText('Unknown operation "' + op + '"');
}

module.exports.processOperation = function(positionalArguments) {

    let requireConnection = true;
    let error = undefined;
    let operation = ('' + positionalArguments[0]).toLowerCase();
    const settings = {};

    function checkNbOfArgs(chk) {
        return chk(positionalArguments.length)
               ? undefined
               : incorrectNbOfArgs();
    }

    // noinspection FallThroughInSwitchStatementJS
    switch(operation) {
        case operations.START:
        case operations.STOP:
        case operations.KILL:
        case operations.REMOVE:
        case operations.STATUS:
        case operations.INFO:
        case operations.SESSIONS:
            error = checkNbOfArgs(n => n === 2);
            break;

        case operations.CANCEL_SESSION:
            error = checkNbOfArgs(n => n === 3);
            break;

        case operations.JAVA_RESOURCES:
        case operations.XSLT_RESOURCES:
        case operations.RESOURCES:
            settings['resourceType'] = operation.split('-').reverse()[1] || GENERAL_RESOURCE_TYPE;
            operation = operations.RESOURCES;
        case operations.DEPLOY:
            error = checkNbOfArgs(n => n <= 2);
            break;
        case operations.PACK:
            error = checkNbOfArgs(n => n >= 2 && n <= 3);
            requireConnection = false;
            break;
        case operations.SETTINGS:
        case operations.PREFERENCES:
            error = checkNbOfArgs(n => n >= 2 && (n - 2) % 3 === 0);
            break;
        case operations.MODELNOTES:
        case operations.CUSTOMNOTES:
        case operations.REPOSITORY:
            error = checkNbOfArgs(n => n >= 2 && n <= 3);
            break;
        case operations.SERVICES:
        case operations.VARIABLES:
            error = checkNbOfArgs(n => n === 1);
            break;
        default :
            error = unknownOp(positionalArguments[0]);
            requireConnection = false;
            break;
    }

    return {error, operation, settings, requireConnection};
};

function getMode(options) {
    return options.nodejs
           ? NODE_SERVICE_TYPE
           : options.java
             ? JAVA_SERVICE_TYPE
             : XUML_SERVICE_TYPE;
}

/**
 * Do the actual work.
 * Take the options we have calculated and do something useful at last.
 * @param options   Set of known options. Calculated from command line and prompt.
 * @param callback  Let others know, that we're done here.
 * @returns {*} Null or whatever the callback returns.
 */
module.exports.perform = function(options, callback) {
    const bridgeInstance = new E2EBridge(options.host, options.port, options.user, options.password);
    // noinspection FallThroughInSwitchStatementJS
    switch(options.operation) {
        case operations.KILL:
            if(options.nodejs || options.java) {
                return callback({
                    errorType: 'Logic error',
                    error: 'Kill operation is only supported for xUML services'
                });
            }
        case operations.START:
        case operations.STOP:
            bridgeInstance.setServiceStatus(options.operation, options.service, getMode(options), callback);
            return null;

        case operations.REMOVE:
            bridgeInstance.removeService(options.service, getMode(options), callback);
            return null;

        case operations.STATUS:
            bridgeInstance.getServiceStatus(options.service, getMode(options), callback);
            return null;

        case operations.INFO:
            if(options.nodejs || options.java) {
                return callback({
                    errorType: 'Logic error',
                    error: 'Info operation is only supported for xUML services'
                });
            }
            bridgeInstance.getXUMLServiceInfo(options.service, callback);
            return null;

        case operations.SESSIONS:
            if(options.nodejs || options.java) {
                return callback({
                    errorType: 'Logic error',
                    error: 'Listing running sessions is only supported for xUML services'
                });
            }
            bridgeInstance.listXUMLServiceSessions(options.service, callback);
            return null;

        case operations.CANCEL_SESSION:
            if(options.nodejs || options.java) {
                return callback({
                    errorType: 'Logic error',
                    error: 'Cancelling sessions is only supported for xUML services'
                });
            }
            bridgeInstance.cancelXUMLServiceSession(options.service, options.session, callback);
            return null;

        case operations.DEPLOY:
            bridgeInstance.deployService(options.file, options.options, callback);
            return null;

        case operations.PACK:
            E2EBridge.pack(options.directory, options, callback);
            return null;

        case operations.PREFERENCES:
            if(options.preferences) {
                bridgeInstance.setServicePreferences(options.service, getMode(options), options.preferences, callback);
            } else {
                bridgeInstance.getServicePreferences(options.service, getMode(options), callback);
            }
            return null;
        case operations.SETTINGS:
            if(options.java) {
                return callback({errorType: 'Logic error', error: 'Settings are not supported for Java services'});
            }
            if(options.settings) {
                bridgeInstance.setServiceSettings(options.service, getMode(options), options.settings, callback);
            } else {
                bridgeInstance.getServiceSettings(options.service, getMode(options), callback);
            }
            return null;

        case operations.MODELNOTES:
            if(options.nodejs || options.java) {
                return callback({errorType: 'Logic error', error: 'Model notes are only supported for xUML services'});
            }
            if(options.filename) {
                bridgeInstance.getXUMLModelNotes(options.service, options.filename, callback);
            } else {
                bridgeInstance.getXUMLModelNotesList(options.service, callback);
            }
            return null;

        case operations.CUSTOMNOTES:
            if(options.nodejs || options.java) {
                return callback({
                    errorType: 'Logic error',
                    error: 'Custom model notes are only supported for xUML services'
                });
            }
            if(options.upload) {
                const file = fs.createReadStream(options.file);
                bridgeInstance.setXUMLCustomNotes(options.service, file, callback);
            } else {
                if(options.file) {
                    bridgeInstance.getXUMLCustomNotes(options.service, (err, content) => {
                        if(err) {
                            return callback(err);
                        }

                        fs.writeFile(options.file, content, callback);
                    });
                } else {
                    bridgeInstance.getXUMLCustomNotes(options.service, callback);
                }
            }
            return null;

        case operations.SERVICES:
            if(options.nodejs) {
                bridgeInstance.listNodeServices(callback);
            } else if(options.java) {
                bridgeInstance.listJavaServices(callback);
            } else {
                bridgeInstance.listXUMLServices(callback);
            }
            return null;

        case operations.RESOURCES:
            if(options['delete']) {
                bridgeInstance.deleteXUMLResources(options.resourceType, options.resource, callback);
            } else if(options.upload) {
                bridgeInstance.uploadXUMLResources(options.resourceType, options.resource, callback);
            } else {
                bridgeInstance.listXUMLResources(options.resourceType, callback);
            }
            return null;

        case operations.VARIABLES:
            bridgeInstance.listXUMLVariables(callback);
            return null;

        case operations.REPOSITORY:
            bridgeInstance.getXUMLServiceRepository(options.service, function(err, repo) {
                if(err) {
                    return callback(err);
                }

                fs.writeFile(options.file, repo, callback);
            });
            return null;

    }
    // Should not happen
    return callback({
        errorType: 'BUG',
        error: '"perform" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
    });
};

/**
 * Execute single task.
 * @param {Bridge} instance - Bridge instance to execute tasks on
 * @param {Task} task - task to execute
 */
module.exports.executeTask = function(instance, task) {
    return new Promise((resolve, reject) => {

        const wrapper = (err, data) => {
            return err
                   ? reject(err)
                   : resolve(data);
        };

        switch(task.type) {
            case operations.DEPLOY:
                instance.deployService(task.parameters['repository'],
                    task.parameters['deploymentOptions'], wrapper);
                return null;
            case operations.SETTINGS:
                instance.setServiceSettings(task.parameters['service'],
                    task.parameters['serviceType'], task.parameters['settings'], wrapper);
                return null;
            case operations.PREFERENCES:
                instance.setServicePreferences(task.parameters['service'],
                    task.parameters['serviceType'], task.parameters['preferences'], wrapper);
                return null;
            case operations.START:
                instance.setServiceStatus('start', task.parameters['service'],
                    task.parameters['serviceType'], wrapper);
                return null;

            default:
                // Should not happen
                return reject({
                    errorType: 'BUG',
                    error: '"executeTask" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
                });
        }
    });
};

module.exports.resolveInputOutput = function(operation, positionalArguments, cliSettings) {

    const settings = {};

    if(operation === operations.DEPLOY) {
        settings['file'] = path.resolve('' + (positionalArguments.shift() || '.'));
    } else if(operation === operations.PACK) {
        settings['directory'] = path.resolve('' + positionalArguments.shift());

        let out = positionalArguments.shift();
        settings['output'] = out
                             ? path.resolve('' + out)
                             : null;
    } else if(operation === operations.RESOURCES) {
        settings['resource'] = positionalArguments.shift();
        if(cliSettings['upload'] && settings['resource']) {
            settings['resource'] = fs.createReadStream(path.resolve('' + settings['resource']));
        }
    } else if(operation !== operations.SERVICES) {
        settings['service'] = '' + positionalArguments.shift();
        if(operation === operations.MODELNOTES) {
            const filename = positionalArguments.shift();
            if(filename) {
                settings['filename'] = '' + filename;
            }
        } else if(operation === operations.CANCEL_SESSION) {
            settings['session'] = positionalArguments.shift();
        } else if(operation === operations.REPOSITORY) {
            settings['file'] = path.resolve('' + (positionalArguments.shift() || '.'));
            if(fs.statSync(settings['file']).isDirectory()) {
                settings['file'] = path.join(settings['file'], `repository-${settings['service']}.rep`);
            }
        } else if(operation === operations.CUSTOMNOTES) {
            const file = positionalArguments.shift();
            if(file) {
                settings['file'] = path.resolve('' + file);
            }
        }
    }

    return settings;
};

module.exports.gatherPreferences = function(positionalArguments) {
    // scan for properties one may want to set
    if(positionalArguments.indexOf('pref') > -1 && positionalArguments.length >= 3) {
        const preferences = {};
        for(let i = 0; i < positionalArguments.length; i++) {
            if(positionalArguments[i] === 'pref') {
                let setName = positionalArguments[i + 1];
                let setValue = positionalArguments[i + 2];

                if(setValue === 'true') {
                    preferences[setName] = true;
                } else if(setValue === 'false') {
                    preferences[setName] = false;
                } else {
                    preferences[setName] = setValue;
                }
                i += 2;
            }
        }
        return preferences;
    }

    return undefined;
};

module.exports.gatherSettings = function(positionalArguments) {
    // scan for settings that should be changed
    if(positionalArguments.indexOf('set') > -1 && positionalArguments.length >= 3) {
        const settings = {};
        for(let i = 0; i < positionalArguments.length; i++) {
            if(positionalArguments[i] === 'set') {
                settings[positionalArguments[i + 1]] = positionalArguments[i + 2];
                i += 2;
            }
        }
        return settings;
    }
    return undefined;
};

module.exports.gatherDeploymentOptions = function(options) {

    const result = Object.assign({}, E2EBridge.defaultDeploymentOptions);

    (options || []).forEach(function(option) {
        const o = option.split('=');
        switch(o[0]) {
            case E2EBridge.deploymentOptions.STARTUP:
                result.startup = true;
                break;
            case E2EBridge.deploymentOptions.OVERWRITE:
                result.overwrite = true;
                break;
            case E2EBridge.deploymentOptions.SETTINGS:
                result.overwritePrefs = true;
                break;
            case E2EBridge.deploymentOptions.NPM_SCRIPTS:
                result.runScripts = true;
            //noinspection FallThroughInSwitchStatementJS
            case E2EBridge.deploymentOptions.NPM_INSTALL:
                result.npmInstall = true;
                break;
            case E2EBridge.deploymentOptions.INSTANCE_NAME:
                result.instanceName = o[1];
                break;
            case E2EBridge.deploymentOptions.PRESERVE_NODE_MODULES:
                result.preserveNodeModules = true;
                break;
            default:
                return {error: helpText('Unknown option "' + option + '".')};
        }
    });

    return {options: result};
};

module.exports.gatherConnectionSettings = function(argv) {
    const settings = {};
    const port = parseInt(argv['p'] || argv['port'] || '8080');
    if(isNaN(port)) {
        return {error: helpText('Port has to be an integer number.')};
    }
    settings['port'] = port || 8080;
    settings['user'] = argv['u'] || argv['user'];
    settings['password'] = argv['P'] || argv['password'];

    settings['host'] = argv['h'] || argv['host'] || 'localhost';

    return {settings};
};

module.exports.isNodeJS = function(argv) {
    return (argv['n'] || argv['N'] || argv['nodejs']) && true;
};

module.exports.isJava = function(argv) {
    return (argv['j'] || argv['java']) && true;
};

module.exports.useGit = function(argv) {
    return (argv['g'] || argv['git']) && true;
};

module.exports.doDelete = function(argv) {
    return (argv['d'] || argv['delete']) && true;
};

module.exports.doUpload = function(argv) {
    return argv['upload'] && true;
};

/**
 * Calculate which formatters should be used.
 * @param options   Set of known options. Calculated from command line.
 * @returns {OutputFormatters} The set of output formatters
 */
module.exports.getOutputFormatters = function(options) {
    const formatters = {
        [operations.RESOURCES]: fmt.resources,
        [operations.SETTINGS]: fmt.settings,
        [operations.PREFERENCES]: fmt.preferences,
        [operations.SERVICES]: fmt.services,
        [operations.INFO]: fmt.info,
    }[options.operation] || {};
    return Object.assign({}, fmt.default, formatters);
};
