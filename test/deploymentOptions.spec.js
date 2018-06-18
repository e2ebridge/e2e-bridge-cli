
const lib = require('../lib/lib');
const bridge = require('e2e-bridge-lib');

describe("Deployment options", function() {

    it("returns default for empty input", function() {
        expect(lib.gatherDeploymentOptions()).toEqual({ options: bridge.defaultDeploymentOptions });
    });

    it("understands 'startup' option", function() {
        expect(lib.gatherDeploymentOptions([bridge.deploymentOptions.STARTUP]).options.startup).toEqual(true);
    });

    it("understands 'overwrite' option", function() {
        expect(lib.gatherDeploymentOptions([bridge.deploymentOptions.OVERWRITE]).options.overwrite).toEqual(true);
    });

    it("understands 'overwritePrefs' option", function() {
        expect(lib.gatherDeploymentOptions([bridge.deploymentOptions.SETTINGS]).options.overwritePrefs).toEqual(true);
    });

    it("understands 'runScripts' option", function() {
        const options = lib.gatherDeploymentOptions([bridge.deploymentOptions.NPM_SCRIPTS]).options;
        expect(options.runScripts).toEqual(true);
        expect(options.npmInstall).toEqual(true);
    });

    it("understands 'npmInstall' option", function() {
        expect(lib.gatherDeploymentOptions([bridge.deploymentOptions.NPM_INSTALL]).options.npmInstall).toEqual(true);
    });

    it("understands 'instanceName' option", function() {
        expect(lib.gatherDeploymentOptions([bridge.deploymentOptions.INSTANCE_NAME+'=gugus']).options.instanceName).toEqual('gugus');
    });
});
