"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A lifetime prevents access to a value after the lifetime has been
 * [[dispose]]ed.
 *
 * Typically, quickjs-emscripten uses Lifetimes to protect C memory pointers.
 */
var Lifetime = /** @class */ (function () {
    /**
     * When the Lifetime is disposed, it will call `disposer(_value)`. Use the
     * disposer function to implement whatever cleanup needs to happen at the end
     * of `value`'s lifetime.
     *
     * `_owner` is not used or controlled by the lifetime. It's just metadata for
     * the creator.
     */
    function Lifetime(_value, copier, disposer, _owner) {
        this._value = _value;
        this.copier = copier;
        this.disposer = disposer;
        this._owner = _owner;
        this._alive = true;
    }
    Object.defineProperty(Lifetime.prototype, "alive", {
        get: function () {
            return this._alive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Lifetime.prototype, "value", {
        /**
         * The value this Lifetime protects. You must never retain the value - it
         * may become invalid, leading to memory errors.
         *
         * @throws If the lifetime has been [[dispose]]d already.
         */
        get: function () {
            this.assertAlive();
            return this._value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Lifetime.prototype, "owner", {
        get: function () {
            return this._owner;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Lifetime.prototype, "dupable", {
        get: function () {
            return !!this.copier;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Create a new handle pointing to the same [[value]].
     */
    Lifetime.prototype.dup = function () {
        this.assertAlive();
        if (!this.copier) {
            throw new Error('Non-dupable lifetime');
        }
        return new Lifetime(this.copier(this._value), this.copier, this.disposer, this._owner);
    };
    Lifetime.prototype.consume = function (map) {
        this.assertAlive();
        var result = map(this);
        this.dispose();
        return result;
    };
    /**
     * Dispose of [[value]] and perform cleanup.
     */
    Lifetime.prototype.dispose = function () {
        this.assertAlive();
        if (this.disposer) {
            this.disposer(this._value);
        }
        this._alive = false;
    };
    Lifetime.prototype.assertAlive = function () {
        if (!this.alive) {
            throw new Error('Lifetime not alive');
        }
    };
    return Lifetime;
}());
exports.Lifetime = Lifetime;
/**
 * A Lifetime that lives forever. Used for constants.
 */
var StaticLifetime = /** @class */ (function (_super) {
    __extends(StaticLifetime, _super);
    function StaticLifetime(value, owner) {
        return _super.call(this, value, undefined, undefined, owner) || this;
    }
    Object.defineProperty(StaticLifetime.prototype, "dupable", {
        // Static lifetime doesn't need a copier to be copiable
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    // Copy returns the same instance.
    StaticLifetime.prototype.dup = function () {
        return this;
    };
    // Dispose does nothing.
    StaticLifetime.prototype.dispose = function () { };
    return StaticLifetime;
}(Lifetime));
exports.StaticLifetime = StaticLifetime;
/**
 * A Lifetime that does not own its `value`. A WeakLifetime never calls its
 * `disposer` function, but can be `dup`ed to produce regular lifetimes that
 * do.
 *
 * Used for function arguments.
 */
var WeakLifetime = /** @class */ (function (_super) {
    __extends(WeakLifetime, _super);
    function WeakLifetime(value, copier, disposer, owner) {
        // We don't care if the disposer doesn't support freeing T
        return _super.call(this, value, copier, disposer, owner) || this;
    }
    WeakLifetime.prototype.dispose = function () {
        this._alive = false;
    };
    return WeakLifetime;
}(Lifetime));
exports.WeakLifetime = WeakLifetime;
function scopeFinally(scope, blockError) {
    var disposeError;
    try {
        scope.dispose();
    }
    catch (error) {
        disposeError = error;
    }
    if (blockError && disposeError) {
        Object.assign(blockError, {
            message: blockError.message + "\n Then, failed to dispose scope: " + disposeError.message,
            disposeError: disposeError,
        });
        throw blockError;
    }
    if (blockError || disposeError) {
        throw blockError || disposeError;
    }
}
/**
 * Scope helps reduce the burden of manually tracking and disposing of
 * Lifetimes. See [[withScope]]. and [[withScopeAsync]].
 */
var Scope = /** @class */ (function () {
    function Scope() {
        this._disposables = new Lifetime(new Set());
    }
    /**
     * Run `block` with a new Scope instance that will be disposed after the block returns.
     * Inside `block`, call `scope.manage` on each lifetime you create to have the lifetime
     * automatically disposed after the block returns.
     *
     * @warning Do not use with async functions. Instead, use [[withScopeAsync]].
     */
    Scope.withScope = function (block) {
        var scope = new Scope();
        var blockError;
        try {
            return block(scope);
        }
        catch (error) {
            blockError = error;
            throw error;
        }
        finally {
            scopeFinally(scope, blockError);
        }
    };
    /**
     * Run `block` with a new Scope instance that will be disposed after the
     * block's returned promise settles. Inside `block`, call `scope.manage` on each
     * lifetime you create to have the lifetime automatically disposed after the
     * block returns.
     */
    Scope.withScopeAsync = function (block) {
        return __awaiter(this, void 0, void 0, function () {
            var scope, blockError, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scope = new Scope();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, block(scope)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        blockError = error_1;
                        throw error_1;
                    case 4:
                        scopeFinally(scope, blockError);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track `lifetime` so that it is disposed when this scope is disposed.
     */
    Scope.prototype.manage = function (lifetime) {
        this._disposables.value.add(lifetime);
        return lifetime;
    };
    Object.defineProperty(Scope.prototype, "alive", {
        get: function () {
            return this._disposables.alive;
        },
        enumerable: true,
        configurable: true
    });
    Scope.prototype.dispose = function () {
        var lifetimes = Array.from(this._disposables.value.values()).reverse();
        for (var _i = 0, lifetimes_1 = lifetimes; _i < lifetimes_1.length; _i++) {
            var lifetime = lifetimes_1[_i];
            if (lifetime.alive) {
                lifetime.dispose();
            }
        }
        this._disposables.dispose();
    };
    return Scope;
}());
exports.Scope = Scope;
