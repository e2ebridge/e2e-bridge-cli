const cd = require('../../../lib/continuous-delivery');
const path = require('path');
const _ = require('lodash');

const projectDir = path.resolve(__dirname, '../data/projects/settings-nodejs-load');

const configuration = require(projectDir + '/configuration.reference');
const deliveryTree = require(projectDir + '/deliveryTree.reference');

describe('Continuous delivery', function() {
    it('reads service settings correctly', function(done) {
        cd.readDefinitions(projectDir,
            (err, result) => {
                expect(err).toBeFalsy();
                if(result) {
                    const pathBegin = new RegExp(projectDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    result = JSON.parse(JSON.stringify(result).replace(pathBegin, ''));
                }
                expect(result).toEqual(configuration);
                done();
            });
    });

    it('transforms settings to delivery tree correctly', function() {
        const errors = [];
        const tree = cd.createDeliveryTree(configuration.domains, configuration.nodes,
            configuration.solutions, configuration.services, errors);
        expect(tree).toEqual(deliveryTree);
        const error = {
            level: 'warn',
            message: "domain 'local', service 'CollectorService': " +
                "'settings': choosing { configFile: 'default' } " +
                "over { configFile: 'other' } even though they both " +
                "match with the same quality"
        };
        expect(errors).toEqual([error]);
    });
});
