```json
emcc ./index.c -o ./build/index.js -O3 -s WASM=1 -s 
```
在使用emcc时，通过指定优化标志来进行优化。优化有级别之分，分别是：-O0，-O1，
-O2，-Os，-Oz，-O3。

https://segmentfault.com/a/1190000011201478
