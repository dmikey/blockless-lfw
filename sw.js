importScripts(
  "https://cdn.jsdelivr.net/gh/golang/go@go1.20.6/misc/wasm/wasm_exec.js"
);

const go = new Go();
WebAssembly.instantiateStreaming(fetch("test.wasm"), go.importObject).then(
  ({ instance }) => go.run(instance)
);
