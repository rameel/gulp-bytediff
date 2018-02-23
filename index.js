const colors = require("ansi-colors");
const filesize = require("filesize");
const log = require("fancy-log");
const mapstream = require("map-stream");
const path = require("path");

function defaultFormatter(data) {
    const saved = data.savings > 0 ? " saved " : " gained ";
    const color = data.savings > 0 ? "green" : "yellow";
    const start = filesize(data.startSize);
    const end = colors[color](filesize(data.endSize));
    const report = ` (${start} -> ${end})`;
    const filename = colors.magenta(data.fileName);

    return filename + saved + filesize(Math.abs(data.savings)) + report;
}

const bytediff = {
    start: function() {
        return mapstream(function(file, cb) {
            // Persist the original size of the file for later
            file.bytediff = {
                startSize: file.contents ? file.contents.length : null
            };
            cb(null, file);
        });
    },
    stop: function(formatter) {
        return mapstream(function(file, cb) {
            if (typeof formatter !== "function") {
                formatter = defaultFormatter;
            }

            if (file.bytediff.startSize) {
                const endSize = file.contents.length;
                const message = formatter({
                    fileName: path.basename(file.path),
                    startSize: file.bytediff.startSize,
                    endSize: endSize,
                    savings: file.bytediff.startSize - endSize,
                    percent: endSize / file.bytediff.startSize
                });

                log(message);
            }

            cb(null, file);
        });
    }
};

module.exports = bytediff;
