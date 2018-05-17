#!/usr/bin/env node

'use strict';

const E2EBridge = require('e2e-bridge-lib');
const util = require('util');
const argv = require('minimist')(process.argv.slice(2));
const prompt = require('prompt');
const path = require('path');

const XUML_SERVICE_TYPE = 'xUML';
const NODE_SERVICE_TYPE = 'node';
const JAVA_SERVICE_TYPE = 'java';

if(argv['help']) {
    showHelp();
    process.exit(0);
}

const settings = {};
let requiredProp = {};

function incorrectNbOfArgs(){
    showHelp('Incorrect number of arguments');
    process.exit(1);
}

function unknownOp(op){
    showHelp('Unknown operation "' + op + '"');
    process.exit(1);
}

let positionalArgs = argv._.slice();

if( positionalArgs.length < 1 ) {
    incorrectNbOfArgs();
} else {
    (function(){
        const value = ('' + positionalArgs[0]).toLowerCase();

        switch(value){
            case 'start':
            case 'stop':
            case 'kill':
            case 'remove':
                if(positionalArgs.length !== 2) {
                    incorrectNbOfArgs();
                }
                requiredProp = { user: { required: true }, password: { required: true, hidden: true } };
                break;

            case 'deploy':
                if(positionalArgs.length > 2) {
                    incorrectNbOfArgs();
                }
                requiredProp = { user: { required: true }, password: { required: true, hidden: true } };
                break;
            case 'pack':
                if(positionalArgs.length > 3) {
                    incorrectNbOfArgs();
                }
                break;
            case 'settings':
            case 'preferences':
                if(positionalArgs.length < 2 || (positionalArgs.length - 2) % 3 != 0) {
                    incorrectNbOfArgs();
                }
                requiredProp = { user: { required: true }, password: { required: true, hidden: true } };
                break;
            default :
                unknownOp(positionalArgs[0]);
                break;

        }

        settings['operation'] = value;
        positionalArgs.shift();
    })();

    if(settings['operation'] === 'deploy'){
        settings['file'] = path.resolve(process.cwd(), '' + (positionalArgs.shift() || '.'));
    } else if(settings['operation'] === 'pack'){
        settings['directory'] = path.resolve(process.cwd(), '' + (positionalArgs.shift() || '.'));

        let out = positionalArgs.shift();
        settings['output'] = out
            ? path.resolve(process.cwd(), '' + out)
            : null;
    } else {
        settings['service'] = '' + positionalArgs.shift();
    }

    if(settings['operation'] === 'preferences') {
        // scan for properties one may want to set
        if (positionalArgs.indexOf('pref') > -1 && positionalArgs.length >= 3) {
            const nPref = {};
            for (let i=0; i<positionalArgs.length;i++) {
                if (positionalArgs[i] === 'pref') {
                    let setName = positionalArgs[i + 1];
                    let setValue = positionalArgs[i + 2];

                    if (setValue === 'true') {
                        nPref[setName] = true;
                    } else if (setValue === 'false') {
                        nPref[setName] = false;
                    } else {
                        nPref[setName] = setValue;
                    }
                    i += 2;
                }
            }
            settings['preferences'] = nPref;
        }
    }


    if(settings['operation'] ==='settings') {
        // scan for settings that should be changed
        if (positionalArgs.indexOf('set') > -1 && positionalArgs.length >= 3) {
            const nSet = {};
            for (let i=0; i<positionalArgs.length; i++) {
                if (positionalArgs[i] === 'set') {
                    let setName = positionalArgs[i + 1];
                    let setValue = positionalArgs[i + 2];
                    nSet[setName] = setValue;
                    i += 2;
                }
            }
            settings['settings'] = nSet;
        }
    }
}


if( argv['u'] || argv['user']){
    settings['user'] = argv['u'] || argv['user'];
}
if( argv['P'] || argv['password']){
    settings['password'] = argv['P'] || argv['password'];
}

settings['host'] = argv['h'] || argv['host'] || 'localhost';
settings['node'] =  argv['n'] || argv['node'] || settings['host'];

if( argv['p'] || argv['port']){
    (function(){
        const port = parseInt(argv['p'] || argv['port']);
        if(isNaN(port)){
            showHelp('Port has to be an integer number.');
            process.exit(1);
        } else {
            settings['port'] = port || 8080;
        }
    })();
} else {
    settings['port'] = 8080;
}

if( argv['N'] || argv['nodejs']){
    settings['nodejs'] = true;
}

settings['git'] = argv['g'] || argv['git'];
settings['shrinkwrap'] = argv['s'] || argv['shrinkwrap'];

if( argv['j'] || argv['java']){
    settings['java'] = true;
}

// Deployment options
settings['options'] = {
    startup:                 false,
    overwrite:               false,
    overwrite_settings:      false,
    npm_install:             false,
    npm_install_run_scripts: false
};

if( settings['operation'] === 'deploy'){
    if(argv['o'] || argv['option'] || argv['options']){
        (function(){
            const options = (argv['o'] || argv['option'] || argv['options']).split(',');
            if(options.length){
                options.forEach(function(option){
                    const o = option.split('=');
                    switch(o[0]){
                        case 'startup' :
                            settings['options'].startup = true;
                            break;
                        case 'overwrite':
                            settings['options'].overwrite = true;
                            break;
                        case 'settings':
                            settings['options'].overwrite_settings = true;
                            break;
                        case 'npm_install_run_scripts':
                            settings['options'].npm_install_run_scripts = true;
                        //noinspection FallThroughInSwitchStatementJS
                        case 'npm_install':
                            settings['options'].npm_install = true;
                            break;
                        case 'instance_name':
                            settings['options'].instance_name = o[1];
                            break;
                        default:
                            showHelp('Unknown option "' + option + '".');
                            process.exit(1);
                    }
                });
            }
        })();
    }
} else {
    if (settings['nodejs'] && settings['java']) {
        showHelp('You must not use Node.js and Java mode simultaneously.')
    }
}

prompt.override = settings;
prompt.message = "Bridge";
prompt.delimiter = ' ';

// Ask user for missing required options.
// The more convenient prompt#addProperties API is broken
prompt.start().get({ properties: requiredProp }, function (err, result) {

    // if all options given on command line, we get the original object as error. From my point of view it's stupid
    // but we have to deal with it.
    if(err) {
        process.stderr.write(JSON.stringify(err, null, '\t'));
        process.exit(3);
    } else {
        Object.keys(result).forEach(function(key){
            settings[key] = result[key];
        })
    }

    process.stdout.write('Working, please wait.\n');

    perform(settings, function (error, result) {
        let out = [settings.operation, ' ', settings.service || settings.file, ': '].join('');
        let err = '';
        if (error) {
            out += 'FAILED\n'.red;
            if (error.errorType) {
                err += 'Type: ' + error.errorType + '\n';
                if (error.error && error.error.message) {
                    err += 'Message: ' + error.error.message;
                } else {
                    err += util.inspect(error, {depth:3});
                }
            } else {
                err += util.inspect(error, {depth:3});
            }
            err += '\n';
            process.stdout.write(out);
            process.stderr.write(err);
            process.exit(2);
        } else {
            out += 'SUCCESS\n'.green;
            process.stdout.write(out);
            if(result) {
                process.stdout.write(util.inspect(result, {depth: 3}) + '\n');
            }
            process.exit(0);
        }
    });
});

/**
 * Displays usage help.
 * @param {?string=} message Additional message to display
 */
function showHelp(message) {
    if( message){
        process.stdout.write(message + '\n');
    }

    process.stdout.write(
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
            '\t-s|--shrinkwrap Execute "npm shrinkwrap" before creating the repository. This is ignored for all commands but "pack".\n\n\n'

    );
}

/**
 * Do the actual work.
 * Take the options we have calculated and do something useful at last.
 * @param options   Set of known options. Calculated from command line and prompt.
 * @param callback  Let others know, that we're done here.
 * @returns {*} Null or whatever the callback returns.
 */
function perform(options, callback){
    const bridgeInstance = new E2EBridge(options.host, options.port, options.user, options.password);
    switch(options.operation){
        case 'kill':
            if(options.nodejs){
                return callback({ errorType: 'Logic error', error: 'Kill operation is not supported for Node.js services'});
            }
        case 'start':
        case 'stop':
            bridgeInstance.setServiceStatus(options.operation, options.service, getMode(options), options.node, callback);
            return null;

        case 'remove':
            bridgeInstance.removeService(options.service, getMode(options), options.node, callback);
            return null;

        case 'deploy':
            bridgeInstance.deployService(options.file, options.options, callback);
            return null;

        case 'pack':
            E2EBridge.pack(options.directory, options, callback);
            return null;

        case 'preferences':
            if(options.preferences) {
                bridgeInstance.setServicePreferences(options.service, getMode(options), options.preferences, callback);
            } else {
                bridgeInstance.getServicePreferences(options.service, getMode(options), callback);
            }
            return null;
        case 'settings':
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
}

function getMode(options) {
    return options.nodejs ? NODE_SERVICE_TYPE : options.java ? JAVA_SERVICE_TYPE : XUML_SERVICE_TYPE;
}

