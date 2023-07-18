importScripts("wasijs.js");
importScripts("browserbindings.js");
importScripts("browserfs.min.js");

// holding some of the application loading
let fsholder = {};
let wasmModule = null;
let fs = null;

// singleton store for indexedDB to hold service worker state
// https://github.com/jakearchibald/svgomg/blob/main/src/js/utils/storage.js#L5
const idbKeyval = (() => {
  let dbInstance;

  function getDB() {
    if (dbInstance) return dbInstance;

    dbInstance = new Promise((resolve, reject) => {
      const openreq = indexedDB.open("svgo-keyval", 1);

      openreq.onerror = () => {
        reject(openreq.error);
      };

      openreq.onupgradeneeded = () => {
        // First time setup: create an empty object store
        openreq.result.createObjectStore("keyval");
      };

      openreq.onsuccess = () => {
        resolve(openreq.result);
      };
    });

    return dbInstance;
  }

  async function withStore(type, callback) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("keyval", type);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      callback(transaction.objectStore("keyval"));
    });
  }

  return {
    async get(key) {
      let request;
      await withStore("readonly", (store) => {
        request = store.get(key);
      });
      return request.result;
    },
    set(key, value) {
      return withStore("readwrite", (store) => {
        store.put(value, key);
      });
    },
    delete(key) {
      return withStore("readwrite", (store) => {
        store.delete(key);
      });
    },
  };
})();

// hook the fetch event to pass into the WASM module
addEventListener("fetch", async (e) => {
  const url = new URL(e.request.url);
  const wasi = new wasijs.default({
    args: [],
    env: {
      BLS_REQUEST_METHOD: "GET",
      BLS_REQUEST_PATH: url.pathname,
      BLS_REQUEST_QUERY: "",
    },
    bindings: { ...wasibrowserbindings.default, fs },
  });

  WebAssembly.instantiate(wasmModule, {
    wasi_snapshot_preview1: wasi.wasiImport,
  }).then((wasmInstance) => {
    wasi.start(wasmInstance);
  });

  // wait until the response is set before resolving promise to service worker
  const checkCondition = () => {
    const p = new Promise(async (resolve, reject) => {
      while (true) {
        const val = await idbKeyval.get("response");
        if (val) {
          resolve(
            new Response(val, {
              headers: { "Content-Type": "text/html" },
            })
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });
    return p;
  };

  // todo: add route matching
  fs.writeSync = async (fd, buffer, offset, length, position, callback) => {
    let responseString = new TextDecoder().decode(buffer);
    if (responseString.trim().length > 0) {
      idbKeyval.set("response", responseString);
    }
    if (callback) {
      callback(null, length);
    }
  };

  // resolve with the response
  e.respondWith(
    (async () => {
      e.waitUntil(checkCondition);
      const response = await checkCondition();
      return response;
    })()
  );
});

// setup the wasm environment
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

  WebAssembly.compileStreaming(fetch("foo/build/foo.wasm")).then((wasm) => {
    wasmModule = wasm;
  });

  event.waitUntil(skipWaiting());
});

// take control of the page
addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
