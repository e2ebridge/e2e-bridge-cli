
const lib = require('../lib/lib');

describe("Operation", function() {

    function testUnderstanding(op, requireConnection) {
        const result = lib.processOperation([op, '']);
        expect(result.error).toBeFalsy();
        expect(result.operation).toEqual(op);
        expect(result.requireConnection).toEqual(requireConnection);
    }

    describe("'start'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.START, true);
        })
    });

    describe("'stop'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.STOP, true);
        })
    });

    describe("'kill'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.START, true);
        })
    });

    describe("'remove'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.REMOVE, true);
        })
    });

    describe("'status'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.STATUS, true);
        })
    });

    describe("'info'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.INFO, true);
        })
    });

    describe("'sessions'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.SESSIONS, true);
        })
    });

    describe("'cancel-session'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.CANCEL_SESSION, '', '']);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.CANCEL_SESSION);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'deploy'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.DEPLOY, true);
        })
    });

    describe("'pack'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.PACK, false);
        })
    });

    describe("'settings'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.SETTINGS, true);
        })
    });

    describe("'preferences'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.PREFERENCES, true);
        })
    });

    describe("'modelnotes'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.MODELNOTES, true);
        })
    });

    describe("'customnotes'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.CUSTOMNOTES, true);
        })
    });

    describe("'repository'", function() {
        it("is understood", function() {
            testUnderstanding(lib.operations.REPOSITORY, true);
        })
    });

    describe("'services'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.SERVICES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.SERVICES);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'resources'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.RESOURCES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.RESOURCES);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'java-resources'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.JAVA_RESOURCES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.RESOURCES);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'xslt-resources'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.XSLT_RESOURCES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.RESOURCES);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'variables'", function() {
        it("is understood", function() {
            const result = lib.processOperation([lib.operations.VARIABLES]);
            expect(result.error).toBeFalsy();
            expect(result.operation).toEqual(lib.operations.VARIABLES);
            expect(result.requireConnection).toEqual(true);
        })
    });

    describe("'gugus'", function() {
        it("is not understood", function() {
            const result = lib.processOperation(['gugus', '']);
            expect(result.error).toBeTruthy();
        })
    });
});
