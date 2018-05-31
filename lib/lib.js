
'use strict';

const E2EBridge = require('e2e-bridge-lib');
const path = require('path');

const XUML_SERVICE_TYPE = 'xUML';
const NODE_SERVICE_TYPE = 'node';
const JAVA_SERVICE_TYPE = 'java';

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
    SERVICES: "services",
    STATUS: "status",
    INFO: "info",
    SESSIONS: "sessions",
    CANCEL_SESSION: "cancel-session",
});
module.exports.operations = operations;

const deploymentOptions = Object.freeze({
    STARTUP: "startup",
    OVERWRITE: "overwrite",
    SETTINGS: "overwritePrefs",
    NPM_SCRIPTS: "runScripts",
    NPM_INSTALL: "npmInstall",
    INSTANCE_NAME: "instanceName"
});
module.exports.deploymentOptions = deploymentOptions;

const defaultDeploymentOptions = Object.freeze({
    startup: false,
    overwrite: false,
    overwritePrefs: false,
    npmInstall: false,
    runScripts: false,
    instanceName: undefined,
});
module.exports.defaultDeploymentOptions = defaultDeploymentOptions;


function helpText(message) {

    let help = '';

    if( message){
        help = message + '\n';
    }

    help +=
        'Usage:\n' +
        'services [[-n|--nodejs]|[-j|--java]] [settings]\n' +
        'start|stop|remove ${ServiceName} [[-n|--nodejs]|[-j|--java]] [settings]\n' +
        'kill ${ServiceName} [settings]\n' +
        'status ${ServiceName} [[-n|--nodejs]|[-j|--java]] [settings]\n' +
        'info ${ServiceName} [settings]\n' +
        'sessions ${ServiceName} [settings]\n' +
        'cancel-session ${ServiceName} ${SessionId} [settings]\n' +
        'deploy [${path/to/repository}|${path/to/directory}] [settings] [-o option]...\n'+
        'pack [${path/to/directory}] [${path/to/repository}] [-g|--git] [-s|--shrinkwrap]\n'+
        'preferences ${ServiceName} [[-n|--nodejs]|[-j|--java]] [pref ${PreferenceName} ${PreferenceValue}]... [settings]\n' +
        'settings ${ServiceName} [-n|--nodejs] [set ${SettingsName} ${SettingValue}]... [settings]\n' +
        'modelnotes ${ServiceName} [${NotesFileName}] [settings]\n' +
        '--help\n\n' +
        'settings:\n' +
        '\t-h|--host <FQDN bridge host> The host, that runs the bridge. Defaults to localhost.\n' +
        '\t-p|--port <bridge port> The port of the bridge. Defaults to 8080.\n' +
        "\t-u|--user <bridge user> User that has the right to perform operation on bridge.\n" +
        "\t\tRequired. If not given, you'll be prompted for it.\n" +
        "\t-P|--password <password for bridge user> Password for the user.\n" +
        "\t\tRequired. If not given, you'll prompted for it, what is recommended as giving your password\n" +
        "\t\tin command line will expose it in your shell's history. Password is masked during prompt.\n\n" +
        'options:\n' +
        '\tstartup|overwrite|settings Multiple options can be separated by comma, like: "-o startup,overwrite"+\n' +
        '\t\tstartup: Launch service after deployment.\n' +
        '\t\toverwrite: Overwrite existing service if one already exists.\n' +
        '\t\toverwritePrefs: Overwrite settings and preferences too.\n' +
        "\t\tnpmInstall: Run 'npm install' (Applies to Node.js services only).\n" +
        "\t\trunScripts: Run 'npm install' (running scripts too) (Applies to Node.js services only).\n" +
        "\tinstanceName=<instance name>: Choose a different instance name  (applies to Node.js services only)\n\n" +
        'Other:\n' +
        '\t-n|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".\n\n\n' +
        '\t-j|--java Assume that the service is a Java service. This is ignored for "deploy" and illegal for "kill".\n\n\n' +
        '\t-g|--git Use "git archive" for building the repository. This is ignored for all commands but "pack".\n\n\n' +
        '\t-s|--shrinkwrap Execute "npm shrinkwrap" before creating the repository. This is ignored for all commands but "pack".\n\n\n';

    return help;
}

module.exports.helpText = helpText;

function incorrectNbOfArgs(){
    return helpText('Incorrect number of arguments');
}

function unknownOp(op){
    return helpText('Unknown operation "' + op + '"');
}

module.exports.processOperation = function(positionalArguments) {

    let requiredProperties = {user: {required: true}, password: {required: true, hidden: true}};
    let error = undefined;
    const operation = ('' + positionalArguments[0]).toLowerCase();

    function checkNbOfArgs(chk) {
        return chk(positionalArguments.length) ? undefined : incorrectNbOfArgs();
    }

    switch (operation) {
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

        case operations.DEPLOY:
            error = checkNbOfArgs(n => n <= 2);
            break;
        case operations.PACK:
            error = checkNbOfArgs(n => n >= 2 && n <= 3);
            requiredProperties = {};
            break;
        case operations.SETTINGS:
        case operations.PREFERENCES:
            error = checkNbOfArgs(n => n >= 2 && (n - 2) % 3 === 0);
            break;
        case operations.MODELNOTES:
            error = checkNbOfArgs(n => n >= 2 && n <= 3);
            break;
        case operations.SERVICES:
            error = checkNbOfArgs(n => n === 1);
            break;
        default :
            error = unknownOp(positionalArguments[0]);
            requiredProperties = {};
            break;
    }

    return {error, operation, requiredProperties};
};

function getMode(options) {
    return options.nodejs ? NODE_SERVICE_TYPE : options.java ? JAVA_SERVICE_TYPE : XUML_SERVICE_TYPE;
}

/**
 * Do the actual work.
 * Take the options we have calculated and do something useful at last.
 * @param options   Set of known options. Calculated from command line and prompt.
 * @param callback  Let others know, that we're done here.
 * @returns {*} Null or whatever the callback returns.
 */
module.exports.perform = function(options, callback){
    const bridgeInstance = new E2EBridge(options.host, options.port, options.user, options.password);
    // noinspection FallThroughInSwitchStatementJS
    switch(options.operation){
        case operations.KILL:
            if(options.nodejs || options.java){
                return callback({ errorType: 'Logic error', error: 'Kill operation is only supported for xUML services'});
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
            if(options.nodejs || options.java){
                return callback({ errorType: 'Logic error', error: 'Info operation is only supported for xUML services'});
            }
            bridgeInstance.getXUMLServiceInfo(options.service, callback);
            return null;

        case operations.SESSIONS:
            if(options.nodejs || options.java){
                return callback({ errorType: 'Logic error', error: 'Listing running sessions is only supported for xUML services'});
            }
            bridgeInstance.listXUMLServiceSessions(options.service, callback);
            return null;

        case operations.CANCEL_SESSION:
            if(options.nodejs || options.java){
                return callback({ errorType: 'Logic error', error: 'Cancelling sessions is only supported for xUML services'});
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
            if(options.java){
                return callback({ errorType: 'Logic error', error: 'Settings are not supported for Java services'});
            }
            if(options.settings) {
                bridgeInstance.setServiceSettings(options.service, getMode(options), options.settings, callback);
            } else {
                bridgeInstance.getServiceSettings(options.service, getMode(options), callback);
            }
            return null;

        case operations.MODELNOTES:
            if(options.nodejs || options.java){
                return callback({ errorType: 'Logic error', error: 'Model notes are only supported for xUML services'});
            }
            if(options.filename) {
                bridgeInstance.getXUMLModelNotes(options.service, options.filename, callback);
            } else {
                bridgeInstance.getXUMLModelNotesList(options.service, callback);
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
    }
    // Should not happen
    return callback({
        errorType: 'BUG',
        error: '"perform" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
    });
};

module.exports.resolveInputOutput = function(operation, positionalArguments) {

    const settings = {};

    if (operation === operations.DEPLOY) {
        settings['file'] = path.resolve('' + (positionalArguments.shift() || '.'));
    } else if (operation === operations.PACK) {
        settings['directory'] = path.resolve('' + positionalArguments.shift());

        let out = positionalArguments.shift();
        settings['output'] = out
            ? path.resolve('' + out)
            : null;
    } else if(operation !== operations.SERVICES) {
        settings['service'] = '' + positionalArguments.shift();
        if(operation === operations.MODELNOTES) {
            const filename = positionalArguments.shift();
            if(filename) {
                settings['filename'] = '' + filename;
            }
        } else if(operation === operations.CANCEL_SESSION) {
            settings['session'] = positionalArguments.shift();
        }
    }

    return settings;
};

module.exports.gatherPreferences = function(positionalArguments) {
    // scan for properties one may want to set
    if (positionalArguments.indexOf('pref') > -1 && positionalArguments.length >= 3) {
        const preferences = {};
        for (let i = 0; i < positionalArguments.length; i++) {
            if (positionalArguments[i] === 'pref') {
                let setName = positionalArguments[i + 1];
                let setValue = positionalArguments[i + 2];

                if (setValue === 'true') {
                    preferences[setName] = true;
                } else if (setValue === 'false') {
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
    if (positionalArguments.indexOf('set') > -1 && positionalArguments.length >= 3) {
        const settings = {};
        for (let i = 0; i < positionalArguments.length; i++) {
            if (positionalArguments[i] === 'set') {
                settings[positionalArguments[i + 1]] = positionalArguments[i + 2];
                i += 2;
            }
        }
        return settings;
    }
    return undefined;
};

module.exports.gatherDeploymentOptions = function(options) {

    const result = Object.assign({}, defaultDeploymentOptions);

    (options||[]).forEach(function (option) {
        const o = option.split('=');
        switch (o[0]) {
            case deploymentOptions.STARTUP :
                result.startup = true;
                break;
            case deploymentOptions.OVERWRITE:
                result.overwrite = true;
                break;
            case deploymentOptions.SETTINGS:
                result.overwritePrefs = true;
                break;
            case deploymentOptions.NPM_SCRIPTS:
                result.runScripts = true;
            //noinspection FallThroughInSwitchStatementJS
            case deploymentOptions.NPM_INSTALL:
                result.npmInstall = true;
                break;
            case deploymentOptions.INSTANCE_NAME:
                result.instanceName = o[1];
                break;
            default:
                return { error: helpText('Unknown option "' + option + '".') };
        }
    });

    return { options: result };
};

module.exports.gatherConnectionSettings = function(argv) {
    const settings = {};
    const port = parseInt(argv['p'] || argv['port'] || '8080');
    if (isNaN(port)) {
        return { error: helpText('Port has to be an integer number.') };
    }
    settings['port'] = port || 8080;
    settings['user'] = argv['u'] || argv['user'];
    settings['password'] = argv['P'] || argv['password'];

    settings['host'] = argv['h'] || argv['host'] || 'localhost';

    return { settings };
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

module.exports.useShrinkwrap = function(argv) {
    return (argv['s'] || argv['shrinkwrap']) && true;
};