const s = require('../../lib/continuous-delivery/service');

describe("Continuous delivery", function() {
    describe("service parser", function() {
        describe("normalization", function() {
            it('of string guarded value works', function() {
                const input = 'gugus';
                const result = s.normalizeGuardedValue(input);
                expect(result).toEqual({
                    domain: [],
                    label: [],
                    node: [],
                    value: 'gugus'
                });
            });

            describe('of entire service', function() {
                it('without settings works', function() {
                    const input = {type: 'xUML', repository: 'Repo.rep'};
                    const result = s.normalize(input, '/home/modeller/cd');
                    expect(result).toEqual({
                        name: '',
                        type: 'xUML',
                        repository: '/home/modeller/cd/repositories/Repo.rep',
                        settings: {},
                        preferences: {},
                        deploymentOptions: {},
                    });
                });

                it('with wrong type throws', function() {
                    const input = {type: 'gugus', repository: 'Repo.rep'};
                    expect(() => s.normalize(input))
                        .toThrowError(/Service type 'gugus' is unknown.*/);
                });

                it('without type throws', function() {
                    const input = {repository: 'Repo.rep'};
                    expect(() => s.normalize(input))
                        .toThrowError(/Service type 'undefined' is unknown.*/);
                });

                it('without repository throws', function() {
                    const input = {type: 'xUML'};
                    expect(() => s.normalize(input))
                        .toThrowError('Missing \'repository\' field.');
                });
            });
        });
    });
});
