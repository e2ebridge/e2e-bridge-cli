#!/usr/bin/env node

var E2EBridge = require('e2e-bridge-lib');
var util = require('util');
var argv = require('minimist')(process.argv.slice(2));
var prompt = require('prompt');
var path = require('path');

/** @const */ var XUML_SERVICE_TYPE = 'xUML';
/** @const */ var NODE_SERVICE_TYPE = 'node';

if(argv['help']) {
    showHelp();
    process.exit(0);
}

var settings = {};

if( argv._.length != 2) {
    showHelp('Incorrect number of arguments');
    process.exit(1);
} else {
    (function(){
        var value = ('' + argv._[0]).toLowerCase();
        var result = ['start', 'stop', 'kill', 'deploy', 'remove'].some(function(element){
            if(element === value){
                settings['operation'] = element;
                return true;
            }
            return false;
        });

        if( !result){
            showHelp('Unknown operation "' + argv._[0] + '"');
            process.exit(1);
        }
    })();

    if(settings['operation'] === 'deploy'){
        settings['file'] = path.resolve(process.cwd(), '' + argv._[1]);
    } else {
        settings['service'] = '' + argv._[1];
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
        var port = parseInt(argv['p'] || argv['port']);
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


// Deployment options
settings['options'] = {
    startup:            false,
    overwrite:          false,
    overwrite_settings: false
};

if( settings['operation'] === 'deploy'){
    if(argv['o'] || argv['option'] || argv['options']){
        (function(){
            var options = (argv['o'] || argv['option'] || argv['options']).split(',');
            if(options.length){
                options.forEach(function(option){
                    switch(option){
                        case 'startup' :
                            settings['options'].startup = true;
                            break;
                        case 'overwrite':
                            settings['options'].overwrite = true;
                            break;
                        case 'settings':
                            settings['options'].overwrite_settings = true;
                            break;
                        default:
                            showHelp('Unknown option "' + option + '".');
                            process.exit(1);
                    }
                });
            }
        })();
    }
}

prompt.override = settings;
prompt.message = "Bridge";
prompt.delimiter = ' ';

// Ask user for missing required options.
// The more convienient prompt#addProperties API is broken
prompt.start().get({ properties: { user: { required: true }, password: { required: true, hidden: true } } }, function (err, result) {

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

    perform(settings, function(error){
        process.stdout.write([settings.operation, ' ', settings.service || settings.file, ': '].join(''));
        if(error){
            process.stdout.write('FAILED\n'.red);
            if(error.errorType) {
                process.stderr.write('Type: ' + error.errorType + '\n');
                if(error.error && error.error.Message) {
                    process.stderr.write('Message: ' + error.error.Message + '\n');
                } else {
                    process.stderr.write(util.inspect(error, {depth:3}));
                }
            } else {
                process.stderr.write(util.inspect(error, {depth:3}));
            }
            process.stderr.write('\n');
            process.exit(2);
        } else {
            process.stdout.write('SUCCESS\n'.green);
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
        'start|stop|remove ${ServiceName} [-N|--nodejs] [settings]\n' +
        'kill ${ServiceName} [settings]\n' +
        'deploy ${path/to/repository} [settings] [-o options]\n'+
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
            '\t\tsettings: Overwrite settings and preferences too.\n\n' +
            'Other:\n' +
            '\t-N|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".\n\n\n'
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
    var bridgeInstance = new E2EBridge(options.host, options.port, options.user, options.password);
    switch(options.operation){
        case 'kill':
            if(options.nodejs){
                return callback({ errorType: 'Logic error', error: 'Kill operation is not supported for Node.js services'});
            }
        case 'start':
        case 'stop':
            bridgeInstance.setServiceStatus(options.operation, options.service, (options.nodejs ? NODE_SERVICE_TYPE : XUML_SERVICE_TYPE), options.node, callback);
            return null;

        case 'remove':
            bridgeInstance.removeService(options.service, (options.nodejs ? NODE_SERVICE_TYPE : XUML_SERVICE_TYPE), options.node, callback);
            return null;

        case 'deploy':
            bridgeInstance.deployService(options.file, options.options, callback);
            return null;
    }
    // Should not happen
    return callback({
        errorType: 'BUG',
        error: '"perform" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
    });
}

