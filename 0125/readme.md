https://github.com/3dgen/cppwasm-book/blob/master/zh/ch2-c-js/ch2-01-js-call-c.md

emcc export1.c -o export1.js  -s MODULARIZE=1 -s ENVIRONMENT=web

-s WASM_ASYNC_COMPILATION=1
-s EXPORT_ES6=1
-s MODULARIZE=1
-s ENVIRONMENT=’’;
-s STANDALONE_WASM = 0
