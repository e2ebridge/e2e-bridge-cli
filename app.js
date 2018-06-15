#!/usr/bin/env node

'use strict';

const prompts = require('prompts');
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

main(processedCLI.settings, processedCLI.requireConnection);

async function main(settings, requireConnection) {
    if (requireConnection && !settings['user'] || !settings['password']) {
        const questions = [
            {
                type: 'text',
                name: 'user',
                message: 'User',
                initial: settings['user']
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password',
                initial: settings['password']
            },
        ];

        let credentials = await prompts(questions);
        Object.assign(settings, credentials);
    }

    process.stdout.write('Working, please wait.\n');

    lib.perform(settings, function (error, result) {

        if (error) {
            process.stdout.write(settings.statusFormatter('error', settings) + '\n');
            process.stdout.write(settings.errorFormatter(error, settings) + '\n');
            process.exit(2);
        } else {
            process.stdout.write(settings.statusFormatter('success', settings) + '\n');
            if (result) {
                process.stdout.write(settings.responseFormatter(result, settings) + '\n');
            }
            process.exit(0);
        }
    });
}

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


    let {error, operation, settings, requireConnection } = lib.processOperation(positionalArgs);
    checkError(error);

    settings['operation'] = operation;
    positionalArgs.shift();

    if(requireConnection) {
        let connectionSettings = lib.gatherConnectionSettings(argv);
        checkError(connectionSettings.error);
        Object.assign(settings, connectionSettings.settings);
    }

    if (operation === lib.operations.PACK) {
        settings['git'] = lib.useGit(argv);
        settings['shrinkwrap'] = lib.useShrinkwrap(argv);
    }

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

    Object.assign(settings, lib.getOutputFormatters(settings));

    return {settings, requireConnection};
}
