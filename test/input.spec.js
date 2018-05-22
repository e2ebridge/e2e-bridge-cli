
const lib = require('../lib/lib');

describe("Input arguments", function() {

    describe("for 'deploy'", function() {

        it("sets 'file'", function() {
            expect(lib.resolveInputOutput(lib.operations.DEPLOY, ['whatever']).file).toMatch(/^.*whatever$/);
        });
    });

    describe("for 'pack'", function() {

        it("sets 'file'", function() {
            expect(lib.resolveInputOutput(lib.operations.PACK, ['whatever']).directory).toMatch(/^.*whatever$/);
        });

        it("sets 'output'", function() {
            expect(lib.resolveInputOutput(lib.operations.PACK, ['whatever', 'somewhere']).output).toMatch(/^.*somewhere$/);
        });
    });

    describe("for anything else", function() {

        it("sets 'service'", function() {
            expect(lib.resolveInputOutput(lib.operations.START, ['whatever']).service).toEqual('whatever');
            expect(lib.resolveInputOutput(lib.operations.STOP, ['whatever']).service).toEqual('whatever');
            expect(lib.resolveInputOutput(lib.operations.KILL, ['whatever']).service).toEqual('whatever');
            expect(lib.resolveInputOutput(lib.operations.REMOVE, ['whatever']).service).toEqual('whatever');
            expect(lib.resolveInputOutput(lib.operations.SETTINGS, ['whatever']).service).toEqual('whatever');
            expect(lib.resolveInputOutput(lib.operations.PREFERENCES, ['whatever']).service).toEqual('whatever');
        });
    });
});