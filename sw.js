importScripts("wasijs.js");
importScripts("browserbindings.js");
importScripts("browserfs.min.js");

let fsholder = {};
let wasmModule = null;
let fs = null;

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

addEventListener("fetch", async (e) => {
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
  // todo: find out why this fires twice
  fs.writeSync = async (fd, buffer, offset, length, position, callback) => {
    let responseString = new TextDecoder().decode(buffer);
    if (responseString.trim().length > 0) {
      idbKeyval.set("response", responseString);
    }
    if (callback) {
      callback(null, length);
    }
  };

  e.respondWith(
    (async () => {
      e.waitUntil(checkCondition);
      const stuff = await checkCondition();
      return stuff;
    })()
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

  WebAssembly.compileStreaming(fetch("foo/build/foo.wasm")).then((wasm) => {
    wasmModule = wasm;
  });

  event.waitUntil(skipWaiting());
});

addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
