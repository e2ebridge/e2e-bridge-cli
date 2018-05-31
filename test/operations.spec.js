
const lib = require('../lib/lib');

describe("Operation", function() {

    const requiredProperties = {user: {required: true}, password: {required: true, hidden: true}};

    function testUnderstanding(op, properties) {
        const result = lib.processOperation([op, '']);
        expect(result.error).toBeFalsy();
        expect(result.operation).toEqual(op);
        expect(result.requiredProperties).toEqual(properties);
    }

    describe("'start'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.START, requiredProperties);
        })
    });

    describe("'stop'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.STOP, requiredProperties);
        })
    });

    describe("'kill'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.START, requiredProperties);
        })
    });

    describe("'remove'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.REMOVE, requiredProperties);
        })
    });

    describe("'status'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.STATUS, requiredProperties);
        })
    });

    describe("'info'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.INFO, requiredProperties);
        })
    });

    describe("'sessions'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.SESSIONS, requiredProperties);
        })
    });

    describe("'cancel-session'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.CANCEL_SESSION, '', '']);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.CANCEL_SESSION);
            expect(result.requiredProperties).toEqual(requiredProperties);
        })
    });

    describe("'deploy'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.DEPLOY, requiredProperties);
        })
    });

    describe("'pack'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.PACK, {});
        })
    });

    describe("'settings'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.SETTINGS, requiredProperties);
        })
    });

    describe("'preferences'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.PREFERENCES, requiredProperties);
        })
    });

    describe("'modelnotes'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.MODELNOTES, requiredProperties);
        })
    });

    describe("'services'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.SERVICES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.SERVICES);
            expect(result.requiredProperties).toEqual(requiredProperties);
        })
    });

    describe("'gugus'", function() {
        it("is not understood", function() {
            const result = lib.processOperation(['gugus', '']);
            expect(result.error).toBeTruthy();
        })
    });
});