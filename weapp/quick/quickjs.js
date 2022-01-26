"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var quickjs_emscripten_module_1 = __importDefault(require("./quickjs-emscripten-module"));
var ffi_1 = require("./ffi");
var lifetime_1 = require("./lifetime");
exports.Lifetime = lifetime_1.Lifetime;
exports.WeakLifetime = lifetime_1.WeakLifetime;
exports.StaticLifetime = lifetime_1.StaticLifetime;
exports.Scope = lifetime_1.Scope;
var QuickJSModule = undefined;
/**
 * This promise will be fulfilled when the QuickJS emscripten module has initialized
 * and the {@link QuickJS} instance can be created.
 */
var ready = quickjs_emscripten_module_1.default().then(function (loadedModule) {
    QuickJSModule = loadedModule;
});
/**
 * @throws if not ready
 */
function getQuickJSEmscriptenModule() {
    if (!QuickJSModule) {
        throw new Error('QuickJS WASM module not initialized. Either wait for `ready` or use getQuickJS()');
    }
    return QuickJSModule;
}
/**
 * QuickJSDeferredPromise wraps a QuickJS promise [[handle]] and allows
 * [[resolve]]ing or [[reject]]ing that promise. Use it to bridge asynchronous
 * code on the host to APIs inside a QuickJSVm.
 *
 * Managing the lifetime of promises is tricky. There are three
 * [[QuickJSHandle]]s inside of each deferred promise object: (1) the promise
 * itself, (2) the `resolve` callback, and (3) the `reject` callback.
 *
 * - If the promise will be fulfilled before the end of it's [[owner]]'s lifetime,
 *   the only cleanup necessary is `deferred.handle.dispose()`, because
 *   calling [[resolve]] or [[reject]] will dispose of both callbacks automatically.
 *
 * - As the return value of a [[VmFunctionImplementation]], return [[handle]],
 *   and ensure that either [[resolve]] or [[reject]] will be called. No other
 *   clean-up is necessary.
 *
 * - In other cases, call [[dispose]], which will dispose [[handle]] as well as the
 *   QuickJS handles that back [[resolve]] and [[reject]]. For this object,
 *   [[dispose]] is idempotent.
 */
var QuickJSDeferredPromise = /** @class */ (function () {
    /**
     * Use [[QuickJSVm.newPromise]] to create a new promise instead of calling
     * this constructor directly.
     * @unstable
     */
    function QuickJSDeferredPromise(args) {
        var _this = this;
        /**
         * Resolve [[handle]] with the given value, if any.
         * Calling this method after calling [[dispose]] is a no-op.
         *
         * Note that after resolving a promise, you may need to call
         * [[QuickJSVm.executePendingJobs]] to propagate the result to the promise's
         * callbacks.
         */
        this.resolve = function (value) {
            if (!_this.resolveHandle.alive) {
                return;
            }
            _this.owner
                .unwrapResult(_this.owner.callFunction(_this.resolveHandle, _this.owner.undefined, value || _this.owner.undefined))
                .dispose();
            _this.disposeResolvers();
            _this.onSettled();
        };
        /**
         * Reject [[handle]] with the given value, if any.
         * Calling this method after calling [[dispose]] is a no-op.
         *
         * Note that after rejecting a promise, you may need to call
         * [[QuickJSVm.executePendingJobs]] to propagate the result to the promise's
         * callbacks.
         */
        this.reject = function (value) {
            if (!_this.rejectHandle.alive) {
                return;
            }
            _this.owner
                .unwrapResult(_this.owner.callFunction(_this.rejectHandle, _this.owner.undefined, value || _this.owner.undefined))
                .dispose();
            _this.disposeResolvers();
            _this.onSettled();
        };
        this.dispose = function () {
            if (_this.handle.alive) {
                _this.handle.dispose();
            }
            _this.disposeResolvers();
        };
        this.owner = args.owner;
        this.handle = args.promiseHandle;
        this.settled = new Promise(function (resolve) {
            _this.onSettled = resolve;
        });
        this.resolveHandle = args.resolveHandle;
        this.rejectHandle = args.rejectHandle;
    }
    Object.defineProperty(QuickJSDeferredPromise.prototype, "alive", {
        get: function () {
            return this.handle.alive || this.resolveHandle.alive || this.rejectHandle.alive;
        },
        enumerable: true,
        configurable: true
    });
    QuickJSDeferredPromise.prototype.disposeResolvers = function () {
        if (this.resolveHandle.alive) {
            this.resolveHandle.dispose();
        }
        if (this.rejectHandle.alive) {
            this.rejectHandle.dispose();
        }
    };
    return QuickJSDeferredPromise;
}());
exports.QuickJSDeferredPromise = QuickJSDeferredPromise;
/**
 * QuickJSVm wraps a QuickJS Javascript runtime (JSRuntime*) and context (JSContext*).
 * This class's methods return {@link QuickJSHandle}, which wrap C pointers (JSValue*).
 * It's the caller's responsibility to call `.dispose()` on any
 * handles you create to free memory once you're done with the handle.
 *
 * Each QuickJSVm instance is isolated. You cannot share handles between different
 * QuickJSVm instances. You should create separate QuickJSVm instances for
 * untrusted code from different sources for isolation.
 *
 * Use [[QuickJS.createVm]] to create a new QuickJSVm.
 *
 * Create QuickJS values inside the interpreter with methods like
 * [[newNumber]], [[newString]], [[newArray]], [[newObject]],
 * [[newFunction]], and [[newPromise]].
 *
 * Call [[setProp]] or [[defineProp]] to customize objects. Use those methods
 * with [[global]] to expose the values you create to the interior of the
 * interpreter, so they can be used in [[evalCode]].
 *
 * Use [[evalCode]] or [[callFunction]] to execute Javascript inside the VM. If
 * you're using asynchronous code inside the QuickJSVm, you may need to also
 * call [[executePendingJobs]]. Executing code inside the runtime returns a
 * result object representing successful execution or an error. You must dispose
 * of any such results to avoid leaking memory inside the VM.
 *
 * Implement memory and CPU constraints with [[setInterruptHandler]]
 * (called regularly while the interpreter runs) and [[setMemoryLimit]].
 * Use [[computeMemoryUsage]] or [[dumpMemoryUsage]] to guide memory limit
 * tuning.
 */
var QuickJSVm = /** @class */ (function () {
    /**
     * Use {@link QuickJS.createVm} to create a QuickJSVm instance.
     */
    function QuickJSVm(args) {
        var _this = this;
        this._undefined = undefined;
        this._null = undefined;
        this._false = undefined;
        this._true = undefined;
        this._global = undefined;
        this._scope = new lifetime_1.Scope();
        this.fnNextId = 0;
        this.fnMap = new Map();
        /**
         * @hidden
         */
        this.cToHostCallbackFunction = function (ctx, this_ptr, argc, argv, fn_data) {
            if (ctx !== _this.ctx.value) {
                throw new Error('QuickJSVm instance received C -> JS call with mismatched ctx');
            }
            var fnId = _this.ffi.QTS_GetFloat64(ctx, fn_data);
            var fn = _this.fnMap.get(fnId);
            if (!fn) {
                throw new Error("QuickJSVm had no callback with id " + fnId);
            }
            return lifetime_1.Scope.withScope(function (scope) {
                var thisHandle = scope.manage(new lifetime_1.WeakLifetime(this_ptr, _this.copyJSValue, _this.freeJSValue, _this));
                var argHandles = new Array(argc);
                for (var i = 0; i < argc; i++) {
                    var ptr = _this.ffi.QTS_ArgvGetJSValueConstPointer(argv, i);
                    argHandles[i] = scope.manage(new lifetime_1.WeakLifetime(ptr, _this.copyJSValue, _this.freeJSValue, _this));
                }
                var ownedResultPtr = 0;
                try {
                    var result = fn.apply(thisHandle, argHandles);
                    if (result) {
                        if ('error' in result && result.error) {
                            throw result.error;
                        }
                        var handle = scope.manage(result instanceof lifetime_1.Lifetime ? result : result.value);
                        ownedResultPtr = _this.ffi.QTS_DupValuePointer(_this.ctx.value, handle.value);
                    }
                }
                catch (error) {
                    ownedResultPtr = _this.errorToHandle(error).consume(function (errorHandle) {
                        return _this.ffi.QTS_Throw(_this.ctx.value, errorHandle.value);
                    });
                }
                return ownedResultPtr;
            });
        };
        /** @hidden */
        this.cToHostInterrupt = function (rt) {
            if (rt !== _this.rt.value) {
                throw new Error('QuickJSVm instance received C -> JS interrupt with mismatched rt');
            }
            var fn = _this.interruptHandler;
            if (!fn) {
                throw new Error('QuickJSVm had no interrupt handler');
            }
            return fn(_this) ? 1 : 0;
        };
        this.copyJSValue = function (ptr) {
            return _this.ffi.QTS_DupValuePointer(_this.ctx.value, ptr);
        };
        this.freeJSValue = function (ptr) {
            _this.ffi.QTS_FreeValuePointer(_this.ctx.value, ptr);
        };
        this.module = args.module;
        this.ffi = args.ffi;
        this.rt = this._scope.manage(args.rt);
        this.ctx = this._scope.manage(args.ctx);
    }
    Object.defineProperty(QuickJSVm.prototype, "undefined", {
        /**
         * [`undefined`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined).
         */
        get: function () {
            if (this._undefined) {
                return this._undefined;
            }
            // Undefined is a constant, immutable value in QuickJS.
            var ptr = this.ffi.QTS_GetUndefined();
            return (this._undefined = new lifetime_1.StaticLifetime(ptr));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuickJSVm.prototype, "null", {
        /**
         * [`null`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null).
         */
        get: function () {
            if (this._null) {
                return this._null;
            }
            // Null is a constant, immutable value in QuickJS.
            var ptr = this.ffi.QTS_GetNull();
            return (this._null = new lifetime_1.StaticLifetime(ptr));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuickJSVm.prototype, "true", {
        /**
         * [`true`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/true).
         */
        get: function () {
            if (this._true) {
                return this._true;
            }
            // True is a constant, immutable value in QuickJS.
            var ptr = this.ffi.QTS_GetTrue();
            return (this._true = new lifetime_1.StaticLifetime(ptr));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuickJSVm.prototype, "false", {
        /**
         * [`false`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/false).
         */
        get: function () {
            if (this._false) {
                return this._false;
            }
            // False is a constant, immutable value in QuickJS.
            var ptr = this.ffi.QTS_GetFalse();
            return (this._false = new lifetime_1.StaticLifetime(ptr));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuickJSVm.prototype, "global", {
        /**
         * [`global`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).
         * A handle to the global object inside the interpreter.
         * You can set properties to create global variables.
         */
        get: function () {
            if (this._global) {
                return this._global;
            }
            // The global is a JSValue, but since it's lifetime is as long as the VM's,
            // we should manage it.
            var ptr = this.ffi.QTS_GetGlobalObject(this.ctx.value);
            // Automatically clean up this reference when we dispose(
            this._scope.manage(this.heapValueHandle(ptr));
            // This isn't technically a static lifetime, but since it has the same
            // lifetime as the VM, it's okay to fake one since when the VM is
            // disposed, no other functions will accept the value.
            this._global = new lifetime_1.StaticLifetime(ptr, this);
            return this._global;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * `typeof` operator. **Not** [standards compliant](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof).
     *
     * @remarks
     * Does not support BigInt values correctly.
     */
    QuickJSVm.prototype.typeof = function (handle) {
        this.assertOwned(handle);
        return this.ffi.QTS_Typeof(this.ctx.value, handle.value);
    };
    /**
     * Converts a Javascript number into a QuickJS value.
     */
    QuickJSVm.prototype.newNumber = function (num) {
        return this.heapValueHandle(this.ffi.QTS_NewFloat64(this.ctx.value, num));
    };
    /**
     * Converts `handle` into a Javascript number.
     * @returns `NaN` on error, otherwise a `number`.
     */
    QuickJSVm.prototype.getNumber = function (handle) {
        this.assertOwned(handle);
        return this.ffi.QTS_GetFloat64(this.ctx.value, handle.value);
    };
    /**
     * Create a QuickJS [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) value.
     */
    QuickJSVm.prototype.newString = function (str) {
        var _this = this;
        var ptr = this.newHeapCharPointer(str).consume(function (charHandle) {
            return _this.ffi.QTS_NewString(_this.ctx.value, charHandle.value);
        });
        return this.heapValueHandle(ptr);
    };
    /**
     * Converts `handle` to a Javascript string.
     */
    QuickJSVm.prototype.getString = function (handle) {
        this.assertOwned(handle);
        return this.ffi.QTS_GetString(this.ctx.value, handle.value);
    };
    /**
     * `{}`.
     * Create a new QuickJS [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer).
     *
     * @param prototype - Like [`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create).
     */
    QuickJSVm.prototype.newObject = function (prototype) {
        if (prototype) {
            this.assertOwned(prototype);
        }
        var ptr = prototype
            ? this.ffi.QTS_NewObjectProto(this.ctx.value, prototype.value)
            : this.ffi.QTS_NewObject(this.ctx.value);
        return this.heapValueHandle(ptr);
    };
    /**
     * `[]`.
     * Create a new QuickJS [array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).
     */
    QuickJSVm.prototype.newArray = function () {
        var ptr = this.ffi.QTS_NewArray(this.ctx.value);
        return this.heapValueHandle(ptr);
    };
    /**
     * Convert a Javascript function into a QuickJS function value.
     * See [[VmFunctionImplementation]] for more details.
     *
     * A [[VmFunctionImplementation]] should not free its arguments or its return
     * value. A VmFunctionImplementation should also not retain any references to
     * its return value.
     *
     * To implement an async function, create a promise with [[newPromise]], then
     * return the deferred promise handle from `deferred.handle` from your
     * function implementation:
     *
     * ```
     * const deferred = vm.newPromise()
     * someNativeAsyncFunction().then(deferred.resolve)
     * return deferred.handle
     * ```
     */
    QuickJSVm.prototype.newFunction = function (name, fn) {
        var fnId = ++this.fnNextId;
        this.fnMap.set(fnId, fn);
        var fnIdHandle = this.newNumber(fnId);
        var funcHandle = this.heapValueHandle(this.ffi.QTS_NewFunction(this.ctx.value, fnIdHandle.value, name));
        // We need to free fnIdHandle's pointer, but not the JSValue, which is retained inside
        // QuickJS for late.
        this.module._free(fnIdHandle.value);
        return funcHandle;
    };
    /**
     * Create a new [[QuickJSDeferredPromise]]. Use `deferred.resolve(handle)` and
     * `deferred.reject(handle)` to fulfill the promise handle available at `deferred.handle`.
     * Note that you are responsible for calling `deferred.dispose()` to free the underlying
     * resources; see the documentation on [[QuickJSDeferredPromise]] for details.
     */
    QuickJSVm.prototype.newPromise = function () {
        var _this = this;
        return lifetime_1.Scope.withScope(function (scope) {
            var mutablePointerArray = scope.manage(_this.newMutablePointerArray(2));
            var promisePtr = _this.ffi.QTS_NewPromiseCapability(_this.ctx.value, mutablePointerArray.value.ptr);
            var promiseHandle = _this.heapValueHandle(promisePtr);
            var _a = Array.from(mutablePointerArray.value.typedArray).map(function (jsvaluePtr) { return _this.heapValueHandle(jsvaluePtr); }), resolveHandle = _a[0], rejectHandle = _a[1];
            return new QuickJSDeferredPromise({
                owner: _this,
                promiseHandle: promiseHandle,
                resolveHandle: resolveHandle,
                rejectHandle: rejectHandle,
            });
        });
    };
    /**
     * `Promise.resolve(value)`.
     * Convert a handle containing a Promise-like value inside the VM into an
     * actual promise on the host.
     *
     * @remarks
     * You may need to call [[executePendingJobs]] to ensure that the promise is resolved.
     *
     * @param promiseLikeHandle - A handle to a Promise-like value with a `.then(onSuccess, onError)` method.
     */
    QuickJSVm.prototype.resolvePromise = function (promiseLikeHandle) {
        var _this = this;
        this.assertOwned(promiseLikeHandle);
        var vmResolveResult = lifetime_1.Scope.withScope(function (scope) {
            var vmPromise = scope.manage(_this.getProp(_this.global, 'Promise'));
            var vmPromiseResolve = scope.manage(_this.getProp(vmPromise, 'resolve'));
            return _this.callFunction(vmPromiseResolve, vmPromise, promiseLikeHandle);
        });
        if (vmResolveResult.error) {
            return Promise.resolve(vmResolveResult);
        }
        return new Promise(function (resolve) {
            lifetime_1.Scope.withScope(function (scope) {
                var resolveHandle = scope.manage(_this.newFunction('resolve', function (value) {
                    resolve({ value: value && value.dup() });
                }));
                var rejectHandle = scope.manage(_this.newFunction('reject', function (error) {
                    resolve({ error: error && error.dup() });
                }));
                var promiseHandle = scope.manage(vmResolveResult.value);
                var promiseThenHandle = scope.manage(_this.getProp(promiseHandle, 'then'));
                _this.unwrapResult(_this.callFunction(promiseThenHandle, promiseHandle, resolveHandle, rejectHandle)).dispose();
            });
        });
    };
    /**
     * `handle[key]`.
     * Get a property from a JSValue.
     *
     * @param key - The property may be specified as a JSValue handle, or as a
     * Javascript string (which will be converted automatically).
     */
    QuickJSVm.prototype.getProp = function (handle, key) {
        var _this = this;
        this.assertOwned(handle);
        var ptr = this.borrowPropertyKey(key).consume(function (quickJSKey) {
            return _this.ffi.QTS_GetProp(_this.ctx.value, handle.value, quickJSKey.value);
        });
        var result = this.heapValueHandle(ptr);
        return result;
    };
    /**
     * `handle[key] = value`.
     * Set a property on a JSValue.
     *
     * @remarks
     * Note that the QuickJS authors recommend using [[defineProp]] to define new
     * properties.
     *
     * @param key - The property may be specified as a JSValue handle, or as a
     * Javascript string or number (which will be converted automatically to a JSValue).
     */
    QuickJSVm.prototype.setProp = function (handle, key, value) {
        var _this = this;
        this.assertOwned(handle);
        this.borrowPropertyKey(key).consume(function (quickJSKey) {
            return _this.ffi.QTS_SetProp(_this.ctx.value, handle.value, quickJSKey.value, value.value);
        });
        // free newly allocated value if key was a string or number. No-op if string was already
        // a QuickJS handle.
    };
    /**
     * [`Object.defineProperty(handle, key, descriptor)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty).
     *
     * @param key - The property may be specified as a JSValue handle, or as a
     * Javascript string or number (which will be converted automatically to a JSValue).
     */
    QuickJSVm.prototype.defineProp = function (handle, key, descriptor) {
        var _this = this;
        this.assertOwned(handle);
        lifetime_1.Scope.withScope(function (scope) {
            var quickJSKey = scope.manage(_this.borrowPropertyKey(key));
            var value = descriptor.value || _this.undefined;
            var configurable = Boolean(descriptor.configurable);
            var enumerable = Boolean(descriptor.enumerable);
            var hasValue = Boolean(descriptor.value);
            var get = descriptor.get
                ? scope.manage(_this.newFunction(descriptor.get.name, descriptor.get))
                : _this.undefined;
            var set = descriptor.set
                ? scope.manage(_this.newFunction(descriptor.set.name, descriptor.set))
                : _this.undefined;
            _this.ffi.QTS_DefineProp(_this.ctx.value, handle.value, quickJSKey.value, value.value, get.value, set.value, configurable, enumerable, hasValue);
        });
    };
    /**
     * [`func.call(thisVal, ...args)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call).
     * Call a JSValue as a function.
     *
     * See [[unwrapResult]], which will throw if the function returned an error, or
     * return the result handle directly. If evaluation returned a handle containing
     * a promise, use [[resolvePromise]] to convert it to a native promise and
     * [[executePendingJobs]] to finish evaluating the promise.
     *
     * @returns A result. If the function threw synchronously, `result.error` be a
     * handle to the exception. Otherwise `result.value` will be a handle to the
     * value.
     */
    QuickJSVm.prototype.callFunction = function (func, thisVal) {
        var _this = this;
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.assertOwned(func);
        var resultPtr = this.toPointerArray(args).consume(function (argsArrayPtr) {
            return _this.ffi.QTS_Call(_this.ctx.value, func.value, thisVal.value, args.length, argsArrayPtr.value);
        });
        var errorPtr = this.ffi.QTS_ResolveException(this.ctx.value, resultPtr);
        if (errorPtr) {
            this.ffi.QTS_FreeValuePointer(this.ctx.value, resultPtr);
            return { error: this.heapValueHandle(errorPtr) };
        }
        return { value: this.heapValueHandle(resultPtr) };
    };
    /**
     * Like [`eval(code)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Description).
     * Evaluates the Javascript source `code` in the global scope of this VM.
     * When working with async code, you many need to call [[executePendingJobs]]
     * to execute callbacks pending after synchronous evaluation returns.
     *
     * See [[unwrapResult]], which will throw if the function returned an error, or
     * return the result handle directly. If evaluation returned a handle containing
     * a promise, use [[resolvePromise]] to convert it to a native promise and
     * [[executePendingJobs]] to finish evaluating the promise.
     *
     * *Note*: to protect against infinite loops, provide an interrupt handler to
     * [[setInterruptHandler]]. You can use [[shouldInterruptAfterDeadline]] to
     * create a time-based deadline.
     *
     * @returns The last statement's value. If the code threw synchronously,
     * `result.error` will be a handle to the exception. If execution was
     * interrupted, the error will have name `InternalError` and message
     * `interrupted`.
     */
    QuickJSVm.prototype.evalCode = function (code) {
        var _this = this;
        var resultPtr = this.newHeapCharPointer(code).consume(function (charHandle) {
            return _this.ffi.QTS_Eval(_this.ctx.value, charHandle.value);
        });
        var errorPtr = this.ffi.QTS_ResolveException(this.ctx.value, resultPtr);
        if (errorPtr) {
            this.ffi.QTS_FreeValuePointer(this.ctx.value, resultPtr);
            return { error: this.heapValueHandle(errorPtr) };
        }
        return { value: this.heapValueHandle(resultPtr) };
    };
    /**
     * Execute pendingJobs on the VM until `maxJobsToExecute` jobs are executed
     * (default all pendingJobs), the queue is exhausted, or the runtime
     * encounters an exception.
     *
     * In QuickJS, promises and async functions create pendingJobs. These do not execute
     * immediately and need to triggered to run.
     *
     * @param maxJobsToExecute - When negative, run all pending jobs. Otherwise execute
     * at most `maxJobsToExecute` before returning.
     *
     * @return On success, the number of executed jobs. On error, the exception
     * that stopped execution. Note that executePendingJobs will not normally return
     * errors thrown inside async functions or rejected promises. Those errors are
     * available by calling [[resolvePromise]] on the promise handle returned by
     * the async function.
     */
    QuickJSVm.prototype.executePendingJobs = function (maxJobsToExecute) {
        if (maxJobsToExecute === void 0) { maxJobsToExecute = -1; }
        var resultValue = this.heapValueHandle(this.ffi.QTS_ExecutePendingJob(this.rt.value, maxJobsToExecute));
        var typeOfRet = this.typeof(resultValue);
        if (typeOfRet === 'number') {
            var executedJobs = this.getNumber(resultValue);
            resultValue.dispose();
            return { value: executedJobs };
        }
        else {
            return { error: resultValue };
        }
    };
    /**
     * In QuickJS, promises and async functions create pendingJobs. These do not execute
     * immediately and need to be run by calling [[executePendingJobs]].
     *
     * @return true if there is at least one pendingJob queued up.
     */
    QuickJSVm.prototype.hasPendingJob = function () {
        return Boolean(this.ffi.QTS_IsJobPending(this.rt.value));
    };
    // customizations
    /**
     * Dump a JSValue to Javascript in a best-effort fashion.
     * Returns `handle.toString()` if it cannot be serialized to JSON.
     */
    QuickJSVm.prototype.dump = function (handle) {
        this.assertOwned(handle);
        var type = this.typeof(handle);
        if (type === 'string') {
            return this.getString(handle);
        }
        else if (type === 'number') {
            return this.getNumber(handle);
        }
        else if (type === 'undefined') {
            return undefined;
        }
        var str = this.ffi.QTS_Dump(this.ctx.value, handle.value);
        try {
            return JSON.parse(str);
        }
        catch (err) {
            return str;
        }
    };
    /**
     * Unwrap a SuccessOrFail result such as a [[VmCallResult]] or a
     * [[ExecutePendingJobsResult]], where the fail branch contains a handle to a QuickJS error value.
     * If the result is a success, returns the value.
     * If the result is an error, converts the error to a native object and throws the error.
     */
    QuickJSVm.prototype.unwrapResult = function (result) {
        var _this = this;
        if (result.error) {
            var dumped = result.error.consume(function (error) { return _this.dump(error); });
            if (dumped && typeof dumped === 'object' && typeof dumped.message === 'string') {
                var exception = new Error(dumped.message);
                if (typeof dumped.name === 'string') {
                    exception.name = dumped.name;
                }
                throw exception;
            }
            throw dumped;
        }
        return result.value;
    };
    /**
     * Set a callback which is regularly called by the QuickJS engine when it is
     * executing code. This callback can be used to implement an execution
     * timeout.
     *
     * The interrupt handler can be removed with [[removeInterruptHandler]].
     */
    QuickJSVm.prototype.setInterruptHandler = function (cb) {
        var prevInterruptHandler = this.interruptHandler;
        this.interruptHandler = cb;
        if (!prevInterruptHandler) {
            this.ffi.QTS_RuntimeEnableInterruptHandler(this.rt.value);
        }
    };
    /**
     * Set the max memory this runtime can allocate.
     * To remove the limit, set to `-1`.
     */
    QuickJSVm.prototype.setMemoryLimit = function (limitBytes) {
        if (limitBytes < 0 && limitBytes !== -1) {
            throw new Error('Cannot set memory limit to negative number. To unset, pass -1');
        }
        this.ffi.QTS_RuntimeSetMemoryLimit(this.rt.value, limitBytes);
    };
    /**
     * Compute memory usage for this runtime. Returns the result as a handle to a
     * JSValue object. Use [[dump]] to convert to a native object.
     * Calling this method will allocate more memory inside the runtime. The information
     * is accurate as of just before the call to `computeMemoryUsage`.
     * For a human-digestible representation, see [[dumpMemoryUsage]].
     */
    QuickJSVm.prototype.computeMemoryUsage = function () {
        return this.heapValueHandle(this.ffi.QTS_RuntimeComputeMemoryUsage(this.rt.value, this.ctx.value));
    };
    /**
     * @returns a human-readable description of memory usage in this runtime.
     * For programmatic access to this information, see [[computeMemoryUsage]].
     */
    QuickJSVm.prototype.dumpMemoryUsage = function () {
        return this.ffi.QTS_RuntimeDumpMemoryUsage(this.rt.value);
    };
    /**
     * Remove the interrupt handler, if any.
     * See [[setInterruptHandler]].
     */
    QuickJSVm.prototype.removeInterruptHandler = function () {
        if (this.interruptHandler) {
            this.ffi.QTS_RuntimeDisableInterruptHandler(this.rt.value);
            this.interruptHandler = undefined;
        }
    };
    Object.defineProperty(QuickJSVm.prototype, "alive", {
        get: function () {
            return this._scope.alive;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of this VM's underlying resources.
     *
     * @throws Calling this method without disposing of all created handles
     * will result in an error.
     */
    QuickJSVm.prototype.dispose = function () {
        this._scope.dispose();
    };
    QuickJSVm.prototype.assertOwned = function (handle) {
        if (handle.owner && handle.owner !== this) {
            throw new Error('Given handle created by a different VM');
        }
    };
    QuickJSVm.prototype.heapValueHandle = function (ptr) {
        return new lifetime_1.Lifetime(ptr, this.copyJSValue, this.freeJSValue, this);
    };
    QuickJSVm.prototype.borrowPropertyKey = function (key) {
        if (typeof key === 'number') {
            return this.newNumber(key);
        }
        if (typeof key === 'string') {
            return this.newString(key);
        }
        // key is already a JSValue, but we're borrowing it. Return a static handle
        // for internal use only.
        return new lifetime_1.StaticLifetime(key.value, this);
    };
    QuickJSVm.prototype.toPointerArray = function (handleArray) {
        var _this = this;
        var typedArray = new Int32Array(handleArray.map(function (handle) { return handle.value; }));
        var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        var ptr = this.module._malloc(numBytes);
        var heapBytes = new Uint8Array(this.module.HEAPU8.buffer, ptr, numBytes);
        heapBytes.set(new Uint8Array(typedArray.buffer));
        return new lifetime_1.Lifetime(ptr, undefined, function (ptr) { return _this.module._free(ptr); });
    };
    QuickJSVm.prototype.newMutablePointerArray = function (length) {
        var _this = this;
        var zeros = new Int32Array(new Array(length).fill(0));
        var numBytes = zeros.length * zeros.BYTES_PER_ELEMENT;
        var ptr = this.module._malloc(numBytes);
        var typedArray = new Int32Array(this.module.HEAPU8.buffer, ptr, length);
        typedArray.set(zeros);
        return new lifetime_1.Lifetime({ typedArray: typedArray, ptr: ptr }, undefined, function (value) { return _this.module._free(value.ptr); });
    };
    QuickJSVm.prototype.newHeapCharPointer = function (string) {
        var _this = this;
        var numBytes = this.module.lengthBytesUTF8(string) + 1;
        var ptr = this.module._malloc(numBytes);
        this.module.stringToUTF8(string, ptr, numBytes);
        return new lifetime_1.Lifetime(ptr, undefined, function (value) { return _this.module._free(value); });
    };
    QuickJSVm.prototype.errorToHandle = function (error) {
        var _this = this;
        if (error instanceof lifetime_1.Lifetime) {
            return error;
        }
        var errorHandle = this.heapValueHandle(this.ffi.QTS_NewError(this.ctx.value));
        if (error.name !== undefined) {
            this.newString(error.name).consume(function (handle) { return _this.setProp(errorHandle, 'name', handle); });
        }
        if (error.message !== undefined) {
            this.newString(error.message).consume(function (handle) { return _this.setProp(errorHandle, 'message', handle); });
        }
        // Disabled due to security leak concerns
        if (error.stack !== undefined) {
            //const handle = this.newString(error.stack)
            // Set to fullStack...? For debugging.
            //this.setProp(errorHandle, 'fullStack', handle)
            //handle.dispose()
        }
        return errorHandle;
    };
    return QuickJSVm;
}());
exports.QuickJSVm = QuickJSVm;
/**
 * QuickJS presents a Javascript interface to QuickJS, a Javascript interpreter that
 * supports ES2019.
 *
 * QuickJS is a singleton. Use the [[getQuickJS]] function to instantiate
 * or retrieve an instance.
 *
 * Use the {@link QuickJS.createVm} method to create a {@link QuickJSVm}.
 *
 * Use the {@link QuickJS.evalCode} method as a shortcut evaluate Javascript safely
 * and return the result as a native Javascript value.
 */
var QuickJS = /** @class */ (function () {
    function QuickJS() {
        var _this = this;
        this.ffi = new ffi_1.QuickJSFFI(getQuickJSEmscriptenModule());
        this.vmMap = new Map();
        this.rtMap = new Map();
        this.module = getQuickJSEmscriptenModule();
        // We need to send this into C-land
        this.cToHostCallbackFunction = function (ctx, this_ptr, argc, argv, fn_data_ptr) {
            try {
                var vm = _this.vmMap.get(ctx);
                if (!vm) {
                    var fn_name = _this.ffi.QTS_GetString(ctx, fn_data_ptr);
                    throw new Error("QuickJSVm(ctx = " + ctx + ") not found for C function call \"" + fn_name + "\"");
                }
                return vm.cToHostCallbackFunction(ctx, this_ptr, argc, argv, fn_data_ptr);
            }
            catch (error) {
                console.error('[C to host error: returning null]', error);
                return 0;
            }
        };
        this.cToHostInterrupt = function (rt) {
            try {
                var vm = _this.rtMap.get(rt);
                if (!vm) {
                    throw new Error("QuickJSVm(rt = " + rt + ") not found for C interrupt");
                }
                return vm.cToHostInterrupt(rt);
            }
            catch (error) {
                console.error('[C to host interrupt: returning error]', error);
                return 1;
            }
        };
        getQuickJSEmscriptenModule();
        if (singleton) {
            throw new Error('Cannot create another QuickJS instance. Use the instance already created (try getQuickJS())');
        }
        singleton = this;
        // This is why we need to be a singleton: each Emscripten module of QuickJS needs
        // a single C callback dispatcher.
        var pointerType = 'i';
        var intType = 'i';
        var functionCallbackWasmTypes = [
            pointerType,
            pointerType,
            pointerType,
            intType,
            pointerType,
            pointerType,
        ];
        var funcCallbackFp = this.module.addFunction(this.cToHostCallbackFunction, functionCallbackWasmTypes.join(''));
        this.ffi.QTS_SetHostCallback(funcCallbackFp);
        var interruptCallbackWasmTypes = [
            intType,
            pointerType,
        ];
        var interruptCallbackFp = this.module.addFunction(this.cToHostInterrupt, interruptCallbackWasmTypes.join(''));
        this.ffi.QTS_SetInterruptCallback(interruptCallbackFp);
    }
    /**
     * Create a QuickJS VM.
     *
     * Each VM is completely independent - you cannot share handles between
     * VMs.
     */
    QuickJS.prototype.createVm = function () {
        var _this = this;
        var rt = new lifetime_1.Lifetime(this.ffi.QTS_NewRuntime(), undefined, function (rt_ptr) {
            _this.rtMap.delete(rt_ptr);
            _this.ffi.QTS_FreeRuntime(rt_ptr);
        });
        var ctx = new lifetime_1.Lifetime(this.ffi.QTS_NewContext(rt.value), undefined, function (ctx_ptr) {
            _this.vmMap.delete(ctx_ptr);
            _this.ffi.QTS_FreeContext(ctx_ptr);
        });
        var vm = new QuickJSVm({
            module: this.module,
            ffi: this.ffi,
            rt: rt,
            ctx: ctx,
        });
        this.vmMap.set(ctx.value, vm);
        this.rtMap.set(rt.value, vm);
        return vm;
    };
    /**
     * One-off evaluate code without needing to create a VM.
     *
     * To protect against infinite loops, use the `shouldInterrupt` option. The
     * [[shouldInterruptAfterDeadline]] function will create a time-based deadline.
     *
     * If you need more control over how the code executes, create a
     * [[QuickJSVm]] instance and use its [[QuickJSVm.evalCode]] method.
     *
     * Asynchronous callbacks may not run during the first call to `evalCode`. If you need to
     * work with async code inside QuickJS, you should create a VM and use [[QuickJSVm.executePendingJobs]].
     *
     * @returns The result is coerced to a native Javascript value using JSON
     * serialization, so properties and values unsupported by JSON will be dropped.
     *
     * @throws If `code` throws during evaluation, the exception will be
     * converted into a native Javascript value and thrown.
     *
     * @throws if `options.shouldInterrupt` interrupted execution, will throw a Error
     * with name `"InternalError"` and  message `"interrupted"`.
     */
    QuickJS.prototype.evalCode = function (code, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return lifetime_1.Scope.withScope(function (scope) {
            var vm = scope.manage(_this.createVm());
            if (options.shouldInterrupt) {
                vm.setInterruptHandler(options.shouldInterrupt);
            }
            if (options.memoryLimitBytes !== undefined) {
                vm.setMemoryLimit(options.memoryLimitBytes);
            }
            var result = vm.evalCode(code);
            if (options.memoryLimitBytes !== undefined) {
                // Remove memory limit so we can dump the result without exceeding it.
                vm.setMemoryLimit(-1);
            }
            if (result.error) {
                var error = vm.dump(scope.manage(result.error));
                throw error;
            }
            var value = vm.dump(scope.manage(result.value));
            return value;
        });
    };
    return QuickJS;
}());
exports.QuickJS = QuickJS;
/**
 * Returns an interrupt handler that interrupts Javascript execution after a deadline time.
 *
 * @param deadline - Interrupt execution if it's still running after this time.
 *   Number values are compared against `Date.now()`
 */
function shouldInterruptAfterDeadline(deadline) {
    var deadlineAsNumber = typeof deadline === 'number' ? deadline : deadline.getTime();
    return function () {
        return Date.now() > deadlineAsNumber;
    };
}
exports.shouldInterruptAfterDeadline = shouldInterruptAfterDeadline;
var singleton = undefined;
/**
 * This is the top-level entrypoint for the quickjs-emscripten library.
 * Get the root QuickJS API.
 */
function getQuickJS() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ready];
                case 1:
                    _a.sent();
                    if (!singleton) {
                        singleton = new QuickJS();
                    }
                    return [2 /*return*/, singleton];
            }
        });
    });
}
exports.getQuickJS = getQuickJS;
/**
 * Provides synchronous access to the QuickJS API once [[getQuickJS]] has resolved at
 * least once.
 * @throws If called before `getQuickJS` resolves.
 */
function getQuickJSSync() {
    if (!singleton) {
        throw new Error('QuickJS not initialized. Await getQuickJS() at least once.');
    }
    return singleton;
}
exports.getQuickJSSync = getQuickJSSync;
