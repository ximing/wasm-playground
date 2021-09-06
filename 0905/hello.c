//#include "stdio.h"
#include <emscripten/emscripten.h>

// emcc hello.c -o hello.js -s STANDALONE_WASM
//int main(){
//    printf("hello world\n");
//    return 0;
//}

//  emcc -s \"EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap','ccall']\" hello.c -o hello.js
// emcc -o hello.js hello.c -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']"
// emcc -o hello.js hello.c -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -s STANDALONE_WASM
// emcc -o hello.js hello.c  -O3 -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -s STANDALONE_WASM
#ifdef __cplusplus
extern "C" {
#endif
int EMSCRIPTEN_KEEPALIVE myadd(int a, int b) {
    int res = a + b;
    res = res + 2;
    return res;
}
#ifdef __cplusplus
}
#endif

int main() {
    int res = myadd(1, 2);
//    printf("res: %d\n", res);
    emscripten_log(EM_LOG_CONSOLE,"res: %d\n", res);
    return 0;
}