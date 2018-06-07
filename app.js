#!/usr/bin/env node

'use strict';

const util = require('util');
const prompt = require('prompt');
const lib = require('./lib/lib');

function checkError(error) {
    if(error) {
        process.stdout.write(error);
        process.exit(1);
    }
}

/**
 * Displays usage help.
 * @param {?string=} message Additional message to display
 */
function showHelp(message) {
    process.stdout.write(lib.helpText(message));
}

const cliParseSettings = {
    boolean: [
        'd', 'delete',
        'upload',
    ]
};

const processedCLI = processCLI(require('minimist')(process.argv.slice(2), cliParseSettings));

if(!processedCLI) {
    process.exit(1);
}

promptForMissingValues(processedCLI.settings, processedCLI.requiredProperties, function(settings) {
    process.stdout.write('Working, please wait.\n');

    lib.perform(settings, function (error, result) {
        let out = [settings.operation, ' ', settings.service || settings.file, ': '].join('');
        let err = '';
        if (error) {
            out += 'FAILED\n'.red;
            if (error.errorType) {
                err += 'Type: ' + error.errorType + '\n';
                if (error.error && error.error.message) {
                    err += 'Message: ' + error.error.message;
                } else {
                    err += util.inspect(error, {depth: 3});
                }
            } else {
                err += util.inspect(error, {depth: 3});
            }
            err += '\n';
            process.stdout.write(out);
            process.stderr.write(err);
            process.exit(2);
        } else {
            out += 'SUCCESS\n'.green;
            process.stdout.write(out);
            if (result) {
                process.stdout.write(util.inspect(result, {depth: 3}) + '\n');
            }
            process.exit(0);
        }
    });
});

function processCLI(argv) {

    if(argv['help']) {
        showHelp();
        return;
    }

    let positionalArgs = argv._.slice();

    if (positionalArgs.length < 1) {
        showHelp('Incorrect number of arguments');
        return;
    }

    let {error, operation, settings, requiredProperties = {} } = lib.processOperation(positionalArgs);
    checkError(error);

    settings['operation'] = operation;
    positionalArgs.shift();


    let connectionSettings = lib.gatherConnectionSettings(argv);
    checkError(connectionSettings.error);
    Object.assign(settings, connectionSettings.settings);

    settings['git'] = lib.useGit(argv);
    settings['shrinkwrap'] = lib.useShrinkwrap(argv);

    if (operation === lib.operations.DEPLOY) {
        const opts =
            [].concat(argv['o'], argv['option'], argv['options'])
              .filter(v => v !== undefined);
        const deployOptions = lib.gatherDeploymentOptions(opts);
        checkError(deployOptions.error);
        settings['options'] = deployOptions.options;
    } else {
        settings['nodejs'] = lib.isNodeJS(argv);
        settings['java'] = lib.isJava(argv);
        settings['delete'] = lib.doDelete(argv);
        settings['upload'] = lib.doUpload(argv);

        if(operation === lib.operations.KILL && (settings['nodejs'] || settings['java'])) {
            showHelp('"Kill" does not accept service type switches.');
            return;
        }

        if (settings['nodejs'] + settings['java'] > 1) {
            showHelp('Only one type switch is allowed. Pick one of --nodejs, or --java.');
            return;
        }

        if(operation !== lib.operations.RESOURCES) {
            if(settings['delete']) {
                showHelp('Only "resources" command can accept "delete" switch.');
                return;
            }
        }

        if(operation !== lib.operations.RESOURCES && operation !== lib.operations.CUSTOMNOTES) {
            if (settings['upload']) {
                showHelp('Only "resources" and "customnotes" commands can accept "upload" switch.');
                return;
            }
        }
    }

    Object.assign(settings, lib.resolveInputOutput(operation, positionalArgs, settings));

    if (operation === lib.operations.PREFERENCES) {
        settings['preferences'] = lib.gatherPreferences(positionalArgs);
    }

    if (operation === lib.operations.SETTINGS) {
        settings['settings'] = lib.gatherSettings(positionalArgs);
    }

    return {settings, requiredProperties};
}

function promptForMissingValues(settings, requiredProperties, done) {
    prompt.override = settings;
    prompt.message = "Bridge";
    prompt.delimiter = ' ';

// Ask user for missing required options.
// The more convenient prompt#addProperties API is broken
    prompt.start().get({properties: requiredProperties}, function (err, result) {

        // if all options given on command line, we get the original object as error. From my point of view it's stupid
        // but we have to deal with it.
        if (err) {
            process.stderr.write(JSON.stringify(err, null, '\t'));
            process.exit(3);
        } else {
            Object.keys(result).forEach(function (key) {
                settings[key] = result[key];
            })
        }

        done(settings);
    });
}

