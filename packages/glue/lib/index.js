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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Covers = exports.CoverPoint = exports.CoverPointType = void 0;
require("colors");
var CoverPointType;
(function (CoverPointType) {
    CoverPointType[CoverPointType["none"] = 0] = "none";
    CoverPointType[CoverPointType["Function"] = 1] = "Function";
    CoverPointType[CoverPointType["Block"] = 2] = "Block";
    CoverPointType[CoverPointType["Expression"] = 3] = "Expression";
})(CoverPointType = exports.CoverPointType || (exports.CoverPointType = {}));
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
        this.coversExecuted = 0;
        this.coversExpected = 0;
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
    Covers.prototype.coverDeclare = function (filePtr, id, line, col, coverType) {
        var filePath = this.loader.exports.__getString(filePtr);
        var coverPoint = new CoverPoint(filePath, line, col, id, coverType);
        if (this.coverPoints.has(id))
            throw new Error("Cannot add dupliate cover point.");
        this.coverPoints.set(id, coverPoint);
        this.coversExpected++;
    };
    Covers.prototype.cover = function (id) {
        if (!this.coverPoints.has(id))
            throw new Error("Cannot cover point that does not exist.");
        var coverPoint = this.coverPoints.get(id);
        coverPoint.covered = true;
        this.coversExecuted++;
    };
    Covers.prototype.reset = function () {
        this.coverPoints.clear();
    };
    Covers.prototype.stringify = function (config) {
        var e_1, _a, e_2, _b;
        var result = '';
        var line = "=".repeat(config.width);
        var files = {};
        var fileData = new Map();
        try {
            for (var _c = __values(this.coverPoints), _d = _c.next(); !_d.done; _d = _c.next()) {
                var cover = _d.value;
                var file = cover[1].file;
                var index = files[file] = files[file] || [];
                index.push(cover[1]);
                if (!fileData.has(file))
                    fileData.set(file, {
                        expected: 0,
                        executed: 0,
                        data: Array()
                    });
                // Ensure all files are stored
                var fdata = fileData.get(file);
                // @ts-ignore.
                if (cover[1].covered) {
                    // @ts-ignore
                    fdata.executed++;
                }
                // @ts-ignore.
                fdata.expected++;
                // @ts-ignore
                fdata.data.push(cover[1]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        result += "\n\nAS-Covers Results\n".blue;
        result += "=================\n\n".gray;
        try {
            for (var _e = __values(fileData.entries()), _f = _e.next(); !_f.done; _f = _e.next()) {
                var _g = __read(_f.value, 2), file = _g[0], data = _g[1];
                result += (file + " - Results\n").blue;
                result += (" - Expected: " + data.expected + "\n").gray;
                result += (" - Executed: " + data.executed + "\n").gray;
                result += (" - Coverage: " + Math.round(100 * (data.executed / data.expected) * 100) / 100 + "\n").gray;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        result += "\n";
        result += ("Total Expected: " + this.coversExpected + "\n").blue;
        result += ("Total Executed: " + this.coversExecuted + "\n").blue;
        result += ("Total Coverage: " + Math.round(100 * (this.coversExecuted / this.coversExpected) * 100) / 100 + "%\n").blue;
        return result;
    };
    return Covers;
}()); //Overall %, Block %, Function %, Expression %, Remaining
exports.Covers = Covers;
function fromEnum(value) {
    var res = '';
    for (var key in CoverPointType) {
        if (CoverPointType[key] === value) {
            return res = key;
        }
    }
    return res;
}
//# sourceMappingURL=index.js.map