#!/usr/bin/env node

'use strict';

const prompts = require('prompts');
const lib = require('./lib/lib');
const path = require('path');
const cd = require('./lib/continuous-delivery');
const nodeUtil = require('util');
const E2EBridge = require('e2e-bridge-lib');
const clorox = require("clorox");

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
        'dry-run',
        'break-on-error',
    ]
};

const argv = require('minimist')(process.argv.slice(2), cliParseSettings);

if(argv['help']) {
    showHelp();
    return;
}

if(argv._.length < 1) {
    showHelp('Incorrect number of arguments');
    process.exit(1);
}

if(('' + argv._[0]).toLowerCase() === lib.operations.DELIVER) {
    if(argv._.length > 2) {
        showHelp('Incorrect number of arguments');
        process.exit(1);
    }

    if(!argv['domain']) {
        showHelp("Required argument 'domain' is missing");
        process.exit(1);
    }

    const toFilter = f => {
        if(Array.isArray(f)) {
            return f;
        } else {
            const s = '' + (f || '');
            return s
                   ? [s]
                   : [];
        }
    };

    const settings = {};
    settings['operation'] = lib.operations.DELIVER;
    settings['projectRoot'] = path.resolve(argv._[1] || '.');
    settings['domain'] = argv['domain'];
    settings['nodeFilter'] = toFilter(argv['node']);
    settings['labelFilter'] = toFilter(argv['label']);
    settings['solutionFilter'] = toFilter(argv['solution']);
    settings['serviceFilter'] = toFilter(argv['service']);
    settings['dry-run'] = argv['dry-run'];
    settings['break-on-error'] = argv['break-on-error'];

    Object.assign(settings, lib.getOutputFormatters(settings));

    handlePromise(deliveryMain(settings), settings);

} else {
    const processedCLI = processCLI(argv);

    if(!processedCLI) {
        process.exit(1);
    }

    const {settings, requireConnection} = processedCLI;

    handlePromise(main(settings, requireConnection), settings);
}

function handlePromise(promise, settings) {
    return promise.catch(reason => {
        process.stdout.write(settings.statusFormatter('error', settings) + '\n');
        process.stdout.write(settings.errorFormatter(reason, settings) + '\n');
        process.exit(2);
    }).then(result => {
        process.stdout.write(settings.statusFormatter('success', settings) + '\n');
        if(result) {
            process.stdout.write(settings.responseFormatter(result, settings) + '\n');
        }
        process.exit(0);
    });
}

function deliveryMain(settings) {
    return new Promise((resolve, reject) => {
        process.stdout.write('Reading configuration.\n');
        cd.readDefinitions(settings['projectRoot'], (err, cfg) => {
            if(!err) {
                if(!settings['dry-run']) {
                    process.stdout.write('Working, please wait.\n');
                }
                deliverConfiguration(cfg, settings)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

async function main(settings, requireConnection) {
    if(requireConnection && (!settings['user'] || !settings['password'])) {
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

    return new Promise((resolve, reject) => {
        lib.perform(settings, function(error, result) {
            return error
                   ? reject(error)
                   : resolve(result);
        });
    });
}

function processCLI(argv) {

    let positionalArgs = argv._.slice();

    let {error, operation, settings, requireConnection} = lib.processOperation(positionalArgs);
    checkError(error);

    settings['operation'] = operation;
    positionalArgs.shift();

    if(requireConnection) {
        let connectionSettings = lib.gatherConnectionSettings(argv);
        checkError(connectionSettings.error);
        Object.assign(settings, connectionSettings.settings);
    }

    if(operation === lib.operations.PACK) {
        settings['git'] = lib.useGit(argv);
    }

    if(operation === lib.operations.DEPLOY) {
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

        if(settings['nodejs'] + settings['java'] > 1) {
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
            if(settings['upload']) {
                showHelp('Only "resources" and "customnotes" commands can accept "upload" switch.');
                return;
            }
        }
    }

    Object.assign(settings, lib.resolveInputOutput(operation, positionalArgs, settings));

    if(operation === lib.operations.PREFERENCES) {
        settings['preferences'] = lib.gatherPreferences(positionalArgs);
    }

    if(operation === lib.operations.SETTINGS) {
        settings['settings'] = lib.gatherSettings(positionalArgs);
    }

    Object.assign(settings, lib.getOutputFormatters(settings));

    return {settings, requireConnection};
}

async function deliverConfiguration(configuration, settings) {

    const errors = [];

    const tree = cd.createDeliveryTree(configuration.domains, configuration.nodes,
        configuration.solutions, configuration.services, errors);

    const filtered = cd.filterDeliveryTree(settings['domain'], settings['nodeFilter'],
        settings['labelFilter'], settings['solutionFilter'], settings['serviceFilter'],
        tree, configuration, errors);

    const taskLists = cd.transformToTaskList(filtered, configuration.nodes);

    let stop = false;
    errors.forEach(({level, message}) => {
        console[level](`${level}: ${message}`);
        if(level === 'error') {
            stop = true;
        }
    });

    if(stop) {
        throw {
            errorType: 'configuration',
            message: 'Configuration errors detected. Skipping execution.'
        };
    }

    const executionErrors = [];
    for(const taskList of taskLists) {
        executionErrors.push(...await executeNodeTaskList(taskList, settings));
    }

    if(executionErrors.filter(e => e).length > 0) {
        throw {
            errorType: 'delivery',
            message: 'Some delivery actions were unsuccessful.'
        };
    }
}

async function executeNodeTaskList(taskList, settings) {
    let cfg = Object.assign({}, taskList.nodeConfig);
    if(!settings['dry-run'] && (!cfg.user || !cfg.password)) {
        const name = `${cfg.name} (${cfg.location.host}:${cfg.location.port})`;
        const questions = [
            {
                type: 'text',
                name: 'user',
                message: `User for ${name}`,
                initial: cfg['user']
            },
            {
                type: 'password',
                name: 'password',
                message: `Password for ${name}`,
                initial: cfg['password']
            },
        ];

        let credentials = await prompts(questions);
        Object.assign(cfg, credentials);
    }

    const instance = new E2EBridge(cfg.location.host, cfg.location.port,
        cfg.user, cfg.password);

    let promises = taskList.serviceTasks.map(async tasks => {
        let skip = false;
        let error = null;
        for(const task of tasks) {
            if(settings['dry-run']) {
                console.log(clorox.green('* ') + `on ${clorox.bold(cfg.name)} would run task`);
                console.log(nodeUtil.inspect(task, {depth: 10, color: true}));
            } else {
                const text = `${task.parameters['service']} on ${clorox.bold(cfg.name)}: ${task.type}`;
                if(skip) {
                    console.log(`${clorox.yellow('⏩')} Skipped: ${text}`);
                    continue;
                }
                try {
                    await lib.executeTask(instance, task);
                    console.log(`${clorox.green('✔')} ${text}`);
                } catch(e) {
                    console.log(`${clorox.red('✘')} ${text}`);
                    if(settings['break-on-error']) {
                        throw e;
                    } else {
                        skip = true;
                        error = e;
                    }
                }
            }
        }

        if(error) {
            throw error;
        }
    });

    if(!settings['break-on-error']) {
        promises = promises.map(p => p.catch(e => e));
    }

    return await Promise.all(promises);
}
