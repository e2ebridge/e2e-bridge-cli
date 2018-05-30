
const lib = require('../lib/lib');

describe("Deployment options", function() {

    it("returns default for empty input", function() {
        expect(lib.gatherDeploymentOptions()).toEqual({ options: lib.defaultDeploymentOptions });
    });

    it("understands 'startup' option", function() {
        expect(lib.gatherDeploymentOptions([lib.deploymentOptions.STARTUP]).options.startup).toEqual(true);
    });

    it("understands 'overwrite' option", function() {
        expect(lib.gatherDeploymentOptions([lib.deploymentOptions.OVERWRITE]).options.overwrite).toEqual(true);
    });

    it("understands 'overwritePrefs' option", function() {
        expect(lib.gatherDeploymentOptions([lib.deploymentOptions.SETTINGS]).options.overwritePrefs).toEqual(true);
    });

    it("understands 'runScripts' option", function() {
        const options = lib.gatherDeploymentOptions([lib.deploymentOptions.NPM_SCRIPTS]).options;
        expect(options.runScripts).toEqual(true);
        expect(options.npmInstall).toEqual(true);
    });

    it("understands 'npmInstall' option", function() {
        expect(lib.gatherDeploymentOptions([lib.deploymentOptions.NPM_INSTALL]).options.npmInstall).toEqual(true);
    });

    it("understands 'instanceName' option", function() {
        expect(lib.gatherDeploymentOptions([lib.deploymentOptions.INSTANCE_NAME+'=gugus']).options.instanceName).toEqual('gugus');
    });
});