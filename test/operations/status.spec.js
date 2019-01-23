'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');

describe('service status commands', function() {
    const namedArgs = {
        host: 'localhost',
        port: 8080,
        user: 'usr',
        password: 'pw'
    };

    const serviceName = 'SomeService';
    let positionalArgs;
    let ioInterface;

    let bridgeCreate;
    const bridgeInstance =
        new Bridge(namedArgs.host, namedArgs.port, namedArgs.user, namedArgs.password);

    let setStatusSpy;

    beforeEach(function() {
        positionalArgs = [
            serviceName
        ];

        ioInterface = new TestIOInterface();

        bridgeCreate = spyOn(Bridge, 'createInstance')
            .and
            .returnValue(bridgeInstance);

        setStatusSpy = spyOn(Bridge.prototype, 'setServiceStatus')
            .and
            .callFake(function(status, name, serviceType, options, callback) {
                return (typeof options === 'function'
                        ? options
                        : callback)();
            });
    });

    describe("set to", function() {

        describe('"start"', function() {
            it('can start an xUML service', async function() {
                const {errors, settings} =
                    main.createSettings('start', namedArgs, positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'start', serviceName, 'xUML');
            });

            it('can start a Node.js service', async function() {
                const {errors, settings} =
                    main.createSettings('start', c.withNodeSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'start', serviceName, 'node');
            });

            it('can start a Java service', async function() {
                const {errors, settings} =
                    main.createSettings('start', c.withJavaSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'start', serviceName, 'java');
            });
        });

        describe('"stop"', function() {
            it('can stop an xUML service', async function() {
                const {errors, settings} =
                    main.createSettings('stop', namedArgs, positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'stop', serviceName, 'xUML', {});
            });

            it('can stop an xUML service with timeout', async function() {
                const localNamedArgs = Object.assign({}, namedArgs, {options: ["stopTimeout=55"]});
                const {errors, settings} =
                    main.createSettings('stop', localNamedArgs, positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'stop', serviceName, 'xUML', {stopTimeout: 55});
            });

            it('can stop a Node.js service', async function() {
                const {errors, settings} =
                    main.createSettings('stop', c.withNodeSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'stop', serviceName, 'node');
            });

            it('can stop a Java service', async function() {
                const {errors, settings} =
                    main.createSettings('stop', c.withJavaSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'stop', serviceName, 'java');
            });
        });

        describe('"kill"', function() {
            it('can kill an xUML service', async function() {
                const {errors, settings} =
                    main.createSettings('kill', namedArgs, positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'kill', serviceName, 'xUML');
            });

            it('can kill an xUML service with timeout', async function() {
                const localNamedArgs = Object.assign({}, namedArgs, {options: ["stopTimeout=55"]});
                const {errors, settings} =
                    main.createSettings('kill', localNamedArgs, positionalArgs);
                expect(errors).toEqual([]);
                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setStatusSpy, bridgeInstance, 'kill', serviceName, 'xUML', {stopTimeout: 55});
            });

            it('does not accept "--nodejs"', async function() {
                const {errors, settings} =
                    main.createSettings('kill', c.withNodeSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([{
                    level: "error",
                    message: "'kill' does not expect '--nodejs' argument"
                }]);
            });

            it('does not accept "--java"', async function() {
                const {errors, settings} =
                    main.createSettings('kill', c.withJavaSwitch(namedArgs), positionalArgs);
                expect(errors).toEqual([{
                    level: "error",
                    message: "'kill' does not expect '--java' argument"
                }]);
            });
        });
    });

    describe('"status"', function() {
        let statusSpy;
        beforeEach(function() {
            statusSpy = spyOn(Bridge.prototype, 'getServiceStatus')
                .and
                .callFake(function(name, serviceType, callback) {
                    return callback();
                });
        });

        it('can query status of an xUML service', async function() {
            const {errors, settings} =
                main.createSettings('status', namedArgs, positionalArgs);
            expect(errors).toEqual([]);
            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(statusSpy, bridgeInstance, serviceName, 'xUML');
        });

        it('can query status of a Node.js service', async function() {
            const {errors, settings} =
                main.createSettings('status', c.withNodeSwitch(namedArgs), positionalArgs);
            expect(errors).toEqual([]);
            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(statusSpy, bridgeInstance, serviceName, 'node');
        });

        it('can query status of a Java service', async function() {
            const {errors, settings} =
                main.createSettings('status', c.withJavaSwitch(namedArgs), positionalArgs);
            expect(errors).toEqual([]);
            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(statusSpy, bridgeInstance, serviceName, 'java');
        });

        it('does not accept additional arguments', async function() {
            const {errors, settings} =
                main.createSettings('status', namedArgs, [...positionalArgs, 'gugus']);
            expect(errors).toEqual([{level: "error", message: "Incorrect number of arguments"}]);
        });
    });
});
