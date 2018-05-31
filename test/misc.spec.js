
const lib = require('../lib/lib');

describe("Argument parser", function() {
    describe("node.js", function() {
        it("from 'n'", function() {
            expect(lib.isNodeJS({ n: true })).toEqual(true);
        });

        it("from 'N'", function() {
            expect(lib.isNodeJS({ N: true })).toEqual(true);
        });

        it("from 'nodejs'", function() {
            expect(lib.isNodeJS({ nodejs: true })).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.isNodeJS({})).toBeFalsy();
        });
    });

    describe("java", function() {
        it("from 'j'", function() {
            expect(lib.isJava({ j: true })).toEqual(true);
        });

        it("from 'java'", function() {
            expect(lib.isJava({ java: true })).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.isJava({})).toBeFalsy();
        });
    });

    describe("git", function() {
        it("from 'g'", function() {
            expect(lib.useGit({ g: true })).toEqual(true);
        });

        it("from 'git'", function() {
            expect(lib.useGit({ git: true })).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.useGit({})).toBeFalsy();
        });
    });

    describe("shrinkwrap", function() {
        it("from 's'", function() {
            expect(lib.useShrinkwrap({ s: true })).toEqual(true);
        });

        it("from 'shrinkwrap'", function() {
            expect(lib.useShrinkwrap({ shrinkwrap: true })).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.useShrinkwrap({})).toBeFalsy();
        });
    });
});