importScripts("wasijs.js");
importScripts("browserbindings.js");
importScripts(
  "https://cdn.jsdelivr.net/npm/browserfs@1.4.3/dist/browserfs.min.js"
);

let fsholder = {};
let wasmModule = null;
let fs = null;
addEventListener("fetch", (e) => {
  const wasi = new wasijs.default({
    args: [],
    env: {
      BLS_REQUEST_METHOD: "GET",
      BLS_REQUEST_PATH: "/",
      BLS_REQUEST_QUERY: "",
    },
    bindings: { ...wasibrowserbindings.default, fs },
  });

  WebAssembly.instantiate(wasmModule, {
    wasi_snapshot_preview1: wasi.wasiImport,
  }).then((wasmInstance) => {
    wasi.start(wasmInstance);
  });

  e.respondWith(
    new Response("<h1>Hello!</h1>", {
      headers: { "Content-Type": "text/html" },
    })
  );
});

addEventListener("install", (event) => {
  BrowserFS.install(fsholder);
  // Configures BrowserFS to use the LocalStorage file system.
  BrowserFS.configure(
    {
      fs: "InMemory",
    },
    function (e) {
      if (e) {
        // An error happened!
        throw e;
      }
      // Otherwise, BrowserFS is ready-to-use!
    }
  );

  fs = fsholder.require("fs");

  // blockless stuff here
  fs.writeSync = (fd, buffer, offset, length, position, callback) => {
    var string = new TextDecoder().decode(buffer);
    console.log(string);
    if (callback) {
      callback(null, length);
    }
  };

  WebAssembly.compileStreaming(fetch("foo/build/foo.wasm")).then((wasm) => {
    wasmModule = wasm;
  });

  event.waitUntil(skipWaiting());
});

addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
