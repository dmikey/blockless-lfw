importScripts("wasijs.js");
importScripts("browserbindings.js");
importScripts(
  "https://cdn.jsdelivr.net/npm/browserfs@1.4.3/dist/browserfs.min.js"
);

let fsholder = {};
addEventListener("fetch", (e) => {
  //   const { pathname } = new URL(e.request.url);
  //   if (!pathname.startsWith(path)) return;

  //   console.log("hello");
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

  var fs = fsholder.require("fs");

  // blockless stuff here
  fs.writeSync = (fd, buffer, offset, length, position, callback) => {
    var string = new TextDecoder().decode(buffer);
    console.log(string);
    if (callback) {
      callback(null, length);
    }
  };

  const wasi = new wasijs.default({
    args: [],
    env: {
      BLS_REQUEST_METHOD: "GET",
      BLS_REQUEST_PATH: "/",
      BLS_REQUEST_QUERY: "",
    },
    bindings: { ...wasibrowserbindings.default, fs },
  });

  let wasm = WebAssembly.compileStreaming(fetch("foo/build/foo.wasm"))
    .then((wasm) => {
      return WebAssembly.instantiate(wasm, {
        wasi_snapshot_preview1: wasi.wasiImport,
      });
    })
    .then((module) => {
      wasi.start(module);
    });

  event.waitUntil(skipWaiting());
});

addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
