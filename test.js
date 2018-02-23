/* global describe, it */

"use strict";

const bytediff = require("./index");
const expect = require("chai").expect;
const gulp = require("gulp");
const map = require("map-stream");
const vinyl = require("vinyl");

function fixture(contents) {
    return new vinyl({
        contents: contents,
        cwd: __dirname,
        base: __dirname,
        path: __dirname + "/fixture.css"
    });
}

describe("gulp-bytediff", () => {
    it("should be able to report the new size of a file", cb => {
        let output = "";
        process.stdout.write = (write => {
            return function(text) {
                output = text;
                write.apply(process.stdout, arguments);
            };
        })(process.stdout.write);

        gulp.src("./index.js")
            .pipe(bytediff.start())
            .pipe(map((file, done) => {
                file.contents = new Buffer("minification happened");
                done(null, file);
            }))
            .pipe(bytediff.stop())
            .pipe(map(() => {
                expect(output).to.have.string("21 B");
                cb();
            }));
    });

    it("should store the original size on the file object", cb => {
        const stream = bytediff.start();

        stream.on("data", data => {
            expect(data.bytediff.startSize).to.eql(5);
            cb();
        });

        stream.write(fixture(new Buffer("hello")));
    });

    it("should pass null contents through", cb => {
        const stream = bytediff.start();

        stream.on("data", data => {
            expect(data.contents).to.eql(null);
            cb();
        });

        stream.write(fixture(null));
    });
});
