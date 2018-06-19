const lib = require('../lib/lib');
const bridge = require('e2e-bridge-lib');

const optionNames = bridge.deploymentOptions;

describe("Deployment options", function() {

    it("returns default for empty input", function() {
        expect(lib.gatherDeploymentOptions()).toEqual({options: bridge.defaultDeploymentOptions});
    });

    it("understands 'startup' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.STARTUP]).options.startup).toEqual(true);
    });

    it("understands 'overwrite' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.OVERWRITE]).options.overwrite).toEqual(true);
    });

    it("understands 'overwritePrefs' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.SETTINGS]).options.overwritePrefs).toEqual(true);
    });

    it("understands 'runScripts' option", function() {
        const options = lib.gatherDeploymentOptions([optionNames.NPM_SCRIPTS]).options;
        expect(options.runScripts).toEqual(true);
        expect(options.npmInstall).toEqual(true);
    });

    it("understands 'npmInstall' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.NPM_INSTALL]).options.npmInstall).toEqual(true);
    });

    it("understands 'instanceName' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.INSTANCE_NAME + '=gugus']).options.instanceName).toEqual('gugus');
    });

    it("understands 'preserveNodeModules' option", function() {
        const options = lib.gatherDeploymentOptions([optionNames.PRESERVE_NODE_MODULES]).options;
        expect(options.preserveNodeModules).toEqual(true);
    });
});
