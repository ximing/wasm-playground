#include "stdio.h"
#ifndef EM_PORT_API
#	if defined(__EMSCRIPTEN__)
#		include <emscripten.h>
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
#		else
#			define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
#		endif
#	else
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype
#		else
#			define EM_PORT_API(rettype) rettype
#		endif
#	endif
#endif

// emcc hello.c -o hello.js -s STANDALONE_WASM
//int main(){
//    printf("hello world\n");
//    return 0;
//}

//  emcc -s \"EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap','ccall']\" hello.c -o hello.js
// emcc -o export.js export.c -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']"
// emcc -o export.js export.c -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -s STANDALONE_WASM
// emcc -o export.js export.c  -O3 -s WASM=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -s STANDALONE_WASM
EM_PORT_API(int) show_me_the_answer() {
    return 42;
}