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
require("colors");
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
        try {
            for (var _c = __values(this.coverPoints), _d = _c.next(); !_d.done; _d = _c.next()) {
                var cover = _d.value;
                var file = cover[1].file;
                var index = files[file] = files[file] || [];
                index.push(cover[1]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var _e = __values(this.coverPoints.entries()), _f = _e.next(); !_f.done; _f = _e.next()) {
                var entry = _f.value;
                result += (entry[1].file + ":" + entry[1].line + ":" + entry[1].col + "\n").blue;
                result += ("ID: " + entry[1].id.toString() + "\n").gray;
                result += ("Type: " + fromEnum(entry[1].type) + "\n").gray;
                result += ("Covered: " + entry[1].covered + "\n").gray;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return result;
    };
    return Covers;
}()); //Overall %, Block %, Function %, Expression %, Remaining
exports.Covers = Covers;
function fromEnum(enu) {
    if (enu === 1 /* Block */) {
        return 'Block';
    }
    else if (enu === 2 /* Expression */) {
        return 'Expression';
    }
    else if (enu === 0 /* Function */) {
        return 'Function';
    }
    else {
        return 'Unknown';
    }
}
//# sourceMappingURL=index.js.map