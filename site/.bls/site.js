import * as __import0 from "wasi_snapshot_preview1";
import * as __import1 from "blockless_memory";
async function instantiate(module, imports = {}) {
  const __module0 = imports.wasi_snapshot_preview1;
  const __module1 = imports.blockless_memory;
  const adaptedImports = {
    wasi_snapshot_preview1: Object.assign(Object.create(__module0), {
      fd_write(fd, iovs, iovs_len, nwritten) {
        // ~lib/bindings/wasi_snapshot_preview1/fd_write(u32, usize, usize, usize) => u16
        fd = fd >>> 0;
        iovs = iovs >>> 0;
        iovs_len = iovs_len >>> 0;
        nwritten = nwritten >>> 0;
        return __module0.fd_write(fd, iovs, iovs_len, nwritten);
      },
      proc_exit(rval) {
        // ~lib/bindings/wasi_snapshot_preview1/proc_exit(u32) => void
        rval = rval >>> 0;
        __module0.proc_exit(rval);
      },
    }),
    blockless_memory: Object.assign(Object.create(__module1), {
      memory_read(buf, len, num) {
        // ~lib/@blockless/sdk/assembly/memory/index/memory_read(usize, u32, usize) => u32
        buf = buf >>> 0;
        len = len >>> 0;
        num = num >>> 0;
        return __module1.memory_read(buf, len, num);
      },
      env_var_read(buf, len, num) {
        // ~lib/@blockless/sdk/assembly/memory/index/env_var_read(usize, u32, usize) => u32
        buf = buf >>> 0;
        len = len >>> 0;
        num = num >>> 0;
        return __module1.env_var_read(buf, len, num);
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  exports._start();
  return exports;
}
export const {
  memory,
  
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
    wasi_snapshot_preview1: __maybeDefault(__import0),
    blockless_memory: __maybeDefault(__import1),
  }
))(new URL("site.wasm", import.meta.url));
function __maybeDefault(module) {
  return typeof module.default === "object" && Object.keys(module).length == 1
    ? module.default
    : module;
}
