
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
    PREFERENCES: "preferences"
});
module.exports.operations = operations;

const deploymentOptions = Object.freeze({
    STARTUP: "startup",
    OVERWRITE: "overwrite",
    SETTINGS: "settings",
    NPM_SCRIPTS: "npm_install_run_scripts",
    NPM_INSTALL: "npm_install",
    INSTANCE_NAME: "instance_name"
});
module.exports.deploymentOptions = deploymentOptions;

const defaultDeploymentOptions = Object.freeze({
    startup: false,
    overwrite: false,
    overwrite_settings: false,
    npm_install: false,
    npm_install_run_scripts: false
});
module.exports.defaultDeploymentOptions = defaultDeploymentOptions;


function helpText(message) {

    let help = '';

    if( message){
        help = message + '\n';
    }

    help +=
        'Usage:\n' +
        'start|stop|remove ${ServiceName} [[-N|--nodejs]|[-j|--java]] [settings]\n' +
        'kill ${ServiceName} [settings]\n' +
        'deploy [${path/to/repository}|${path/to/directory}] [settings] [-o options]\n'+
        'pack [${path/to/directory}] [${path/to/repository}] [-g|--git] [-s|--shrinkwrap]\n'+
        'preferences ${ServiceName} [pref ${PreferenceName} ${PreferenceValue}]... [settings]\n' +
        'settings ${ServiceName} [set ${SettingsName} ${SettingValue}]... [settings]\n' +
        '--help\n\n' +
        'settings:\n' +
        '\t-h|--host <FQDN bridge host> The host, that runs the bridge. Defaults to localhost.\n' +
        '\t-p|--port <bridge port> The port of the bridge. Defaults to 8080.\n' +
        '\t-n|--node <node name> The name of bridge node. Ignored for deployment. Defaults to ${host}.\n' +
        "\t-u|--user <bridge user> User that has the right to perform operation on bridge.\n" +
        "\t\tRequired. If not given, you'll be prompted for it.\n" +
        "\t-P|--password <password for bridge user> Password for the user.\n" +
        "\t\tRequired. If not given, you'll prompted for it, what is recommended as giving your password\n" +
        "\t\tin command line will expose it in your shell's history. Password is masked during prompt.\n\n" +
        'options:\n' +
        '\tstartup|overwrite|settings Multiple options can be separated by comma, like: "-o startup,overwrite"+\n' +
        '\t\tstartup: Launch service after deployment.\n' +
        '\t\toverwrite: Overwrite existing service if one already exists.\n' +
        '\t\tsettings: Overwrite settings and preferences too.\n' +
        "\t\tnpm_install: Run 'npm install' (Applies to Node.js services only).\n" +
        "\t\tnpm_install_run_scripts: Run 'npm install' (running scripts too) (Applies to Node.js services" +
        " only).\n\n" +
        'Other:\n' +
        '\t-N|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".\n\n\n' +
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

    let requiredProperties = {};
    let error = undefined;
    const operation = ('' + positionalArguments[0]).toLowerCase();

    switch (operation) {
        case operations.START:
        case operations.STOP:
        case operations.KILL:
        case operations.REMOVE:
            if (positionalArguments.length !== 2) {
                error = incorrectNbOfArgs();
                break;
            }
            requiredProperties = {user: {required: true}, password: {required: true, hidden: true}};
            break;

        case operations.DEPLOY:
            if (positionalArguments.length > 2) {
                error = incorrectNbOfArgs();
                break;
            }
            requiredProperties = {user: {required: true}, password: {required: true, hidden: true}};
            break;
        case operations.PACK:
            if (positionalArguments.length < 2 || positionalArguments.length > 3) {
                error = incorrectNbOfArgs();
            }
            break;
        case operations.SETTINGS:
        case operations.PREFERENCES:
            if (positionalArguments.length < 2 || (positionalArguments.length - 2) % 3 !== 0) {
                error = incorrectNbOfArgs();
                break;
            }
            requiredProperties = {user: {required: true}, password: {required: true, hidden: true}};
            break;
        default :
            error = unknownOp(positionalArguments[0]);
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
            if(options.nodejs){
                return callback({ errorType: 'Logic error', error: 'Kill operation is not supported for Node.js services'});
            }
        case operations.START:
        case operations.STOP:
            bridgeInstance.setServiceStatus(options.operation, options.service, getMode(options), options.node, callback);
            return null;

        case operations.REMOVE:
            bridgeInstance.removeService(options.service, getMode(options), options.node, callback);
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
            if(options.settings) {
                bridgeInstance.setServiceSettings(options.service, getMode(options), options.settings, callback);
            } else {
                bridgeInstance.getServiceSettings(options.service, getMode(options), callback);
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
    } else {
        settings['service'] = '' + positionalArguments.shift();
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

module.exports.gatherDeploymentOptions = function(optionsString) {

    const result = Object.assign({}, defaultDeploymentOptions);

    if(!optionsString || optionsString === '') {
        return result;
    }

    const options = optionsString.split(',');
    options.forEach(function (option) {
        const o = option.split('=');
        switch (o[0]) {
            case deploymentOptions.STARTUP :
                result.startup = true;
                break;
            case deploymentOptions.OVERWRITE:
                result.overwrite = true;
                break;
            case deploymentOptions.SETTINGS:
                result.overwrite_settings = true;
                break;
            case deploymentOptions.NPM_SCRIPTS:
                result.npm_install_run_scripts = true;
            //noinspection FallThroughInSwitchStatementJS
            case deploymentOptions.NPM_INSTALL:
                result.npm_install = true;
                break;
            case deploymentOptions.INSTANCE_NAME:
                result.instance_name = o[1];
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
    settings['node'] = argv['n'] || argv['node'] || settings['host'];

    return { settings };
};

module.exports.isNodeJS = function(argv) {
    return (argv['N'] || argv['nodejs']) && true;
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