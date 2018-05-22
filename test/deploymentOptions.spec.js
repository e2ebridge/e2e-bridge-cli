
const lib = require('../lib/lib');

describe("Deployment options", function() {

    it("returns default for empty input", function() {
        expect(lib.gatherDeploymentOptions()).toEqual(lib.defaultDeploymentOptions);
    });

    it("understands 'startup' option", function() {
        expect(lib.gatherDeploymentOptions(lib.deploymentOptions.STARTUP).options.startup).toEqual(true);
    });

    it("understands 'overwrite' option", function() {
        expect(lib.gatherDeploymentOptions(lib.deploymentOptions.OVERWRITE).options.overwrite).toEqual(true);
    });

    it("understands 'settings' option", function() {
        expect(lib.gatherDeploymentOptions(lib.deploymentOptions.SETTINGS).options.overwrite_settings).toEqual(true);
    });

    it("understands 'npm_install_run_scripts' option", function() {
        const options = lib.gatherDeploymentOptions(lib.deploymentOptions.NPM_SCRIPTS).options;
        expect(options.npm_install_run_scripts).toEqual(true);
        expect(options.npm_install).toEqual(true);
    });

    it("understands 'npm_install' option", function() {
        expect(lib.gatherDeploymentOptions(lib.deploymentOptions.NPM_INSTALL).options.npm_install).toEqual(true);
    });

    it("understands 'instance_name' option", function() {
        expect(lib.gatherDeploymentOptions(lib.deploymentOptions.INSTANCE_NAME+'=gugus').options.instance_name).toEqual('gugus');
    });
});