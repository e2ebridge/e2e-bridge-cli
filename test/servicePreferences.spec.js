
const lib = require('../lib/lib');

describe("Service settings", function() {

    it("does nothing for too short input", function() {
        expect(lib.gatherSettings(['set', 'x'])).toBeUndefined();
    });

    it("understands single setting", function() {
        expect(lib.gatherSettings(['set', 'x', 'y'])).toEqual({ x: 'y' });
    });

    it("understands many settings", function() {
        expect(lib.gatherSettings([
            'set', 'x', 'y',
            'set', 'z', 'abrakadabra',
            'set', 'b', 'c',
        ])).toEqual({ x: 'y', z: 'abrakadabra', b: 'c' });
    });

    it("skips garbage", function() {
        expect(lib.gatherSettings([
            'nothing',
            'set', 'x', 'y',
            'garbage', 'z', 'abrakadabra',
            'set', 'b', 'c',
        ])).toEqual({ x: 'y', b: 'c' });
    });
});