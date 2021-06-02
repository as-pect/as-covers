"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Covers = exports.CoverPoint = void 0;
var CoverPoint = /** @class */ (function () {
    function CoverPoint(file, line, col, id, type) {
        this.file = file;
        this.line = line;
        this.col = col;
        this.id = id;
        this.type = type;
        this.covered = false;
    }
    return CoverPoint;
}());
exports.CoverPoint = CoverPoint;
var Covers = /** @class */ (function () {
    function Covers() {
        this.coverPoints = new Map();
    }
    Covers.prototype.installImports = function (imports) {
        imports.__asCovers = {
            cover: this.cover.bind(this),
            coverDeclare: this.coverDeclare.bind(this),
        };
        return imports;
    };
    Covers.prototype.registerLoader = function (loader) {
        this.loader = loader;
    };
    Covers.prototype.coverDeclare = function (filePtr, line, col, id, coverType) {
        var coverPoint = new CoverPoint(this.loader.exports.__getString(filePtr), line, col, id, coverType);
        if (this.coverPoints.has(id))
            throw new Error("Cannot add dupliate cover point.");
        this.coverPoints.set(id, coverPoint);
    };
    Covers.prototype.cover = function (id) {
        if (!this.coverPoints.has(id))
            throw new Error("Cannot cover point that does not exist.");
        var coverPoint = this.coverPoints.get(id);
        coverPoint.covered = true;
    };
    Covers.prototype.reset = function () {
        this.coverPoints.clear();
    };
    Covers.prototype.stringify = function (config) {
        var e_1, _a;
        var line = "=".repeat(config.width);
        var files = {};
        try {
            for (var _b = __values(this.coverPoints), _c = _b.next(); !_c.done; _c = _b.next()) {
                var cover = _c.value;
                var file = cover[1].file;
                var index = files[file] = files[file] || [];
                index.push(cover[1]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var fileList = Object.keys(files);
        return "\n" + line + "\nColumns Go Here\n" + line + "\nOne Line Per File\n";
    };
    return Covers;
}());
exports.Covers = Covers;
//# sourceMappingURL=index.js.map