BrowserFS.install(window);
BrowserFS.configure(
  {
    fs: "InMemory",
  },
  function (e) {
    if (e) {
      throw e;
    }
  }
);
var fs = require("fs");

// blockless stuff here
fs.writeSync = (fd, buffer, offset, length, position, callback) => {
  var string = new TextDecoder().decode(buffer);

  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(string, "text/html");

  console.log(string);

  // Get the <head> element from the parsed document
  const parsedHead = htmlDoc.head;

  // Get the main document's <head> element
  const mainDocumentHead = document.head;

  // Move all children from parsedHead to mainDocumentHead
  while (parsedHead.firstChild) {
    mainDocumentHead.appendChild(parsedHead.firstChild);
  }

  // Get the <body> element from the parsed document
  const parsedBody = htmlDoc.body;

  // Get the main document's <body> element
  const mainDocumentBody = document.body;

  // Move all children from parsedBody to mainDocumentBody
  while (parsedBody.firstChild) {
    mainDocumentBody.appendChild(parsedBody.firstChild);
  }

  if (callback) {
    callback(null, length);
  }
};

//GET THE BROWSER QUERY STRING
const queryString = window.location.search;

const wasi = new wasijs.default({
  args: [],
  env: {
    BLS_REQUEST_METHOD: "GET",
    BLS_REQUEST_PATH: "/",
    BLS_REQUEST_QUERY: queryString,
  },
  bindings: { ...wasibrowserbindings.default, fs },
});

WebAssembly.compileStreaming(fetch("foo/build/foo.wasm"))
  .then((wasm) => {
    return WebAssembly.instantiate(wasm, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
  })
  .then((module) => {
    wasi.start(module);
  });
