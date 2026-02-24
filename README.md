# Transformers.js v4 — CORS Reproduction

Minimal reproduction for [huggingface/transformers.js#1527](https://github.com/huggingface/transformers.js/issues/1527).

## Branches

| Branch | Transformers version | Expected result |
|--------|---------------------|-----------------|
| `main` | `@huggingface/transformers@4.0.0-next.3` (npm) | ❌ `Failed to construct 'Worker'` CORS error |
| `test-v4-loadWasmFactory-fix` | Built from [`v4-loadWasmFactory-fix`](https://github.com/huggingface/transformers.js/tree/v4-loadWasmFactory-fix) @ [`41a6ca7`](https://github.com/huggingface/transformers.js/commit/41a6ca72d2be90f79ac397fe5e0f334ae9a15416) | ❌ `Failed to construct 'URL': Invalid URL` — still broken |

> **Note:** `@huggingface/transformers@4.0.0-next.4` on npm does **not** include the `v4-loadWasmFactory-fix` branch changes. This branch vendors the built package directly from that branch.

## Error (main — 4.0.0-next.3)

```
Failed to construct 'Worker': Script at
'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.25.0-dev.../dist'
cannot be accessed from origin 'http://localhost:5175'.
```

## Error (test-v4-loadWasmFactory-fix)

```
no available backend found. ERR: [wasm] TypeError: Failed to construct 'URL': Invalid URL
```

The error changed but the pipeline still fails. The fix correctly detects `crossOriginIsolated === true` in `canUseBlobURLs()` and skips blob URLs, but then returns the CDN URL unchanged — ORT still tries to load a cross-origin Worker from it, which COEP blocks.

## Root Cause

In v4, `backends/onnx.js` sets `wasmPaths` to `cdn.jsdelivr.net` by default.
This works fine on its own — **but** when the page has **COEP headers** (`Cross-Origin-Embedder-Policy: require-corp`), browsers block all cross-origin resources that lack a `Cross-Origin-Resource-Policy` header, including the CDN-served ORT Worker script.

COEP headers are required for `SharedArrayBuffer`, which ONNX Runtime itself needs for multi-threaded WASM execution. So the conflict is:

1. ORT needs `SharedArrayBuffer` → requires COEP headers
2. COEP blocks cross-origin resources without CORP headers
3. v4 defaults `wasmPaths` to CDN → CDN files are cross-origin
4. **💥 Worker construction fails**

## Reproduce

```bash
npm install
npm run dev
# Open http://localhost:5175 — error in console
```

## Versions

- Built from `v4-loadWasmFactory-fix` branch (commit `41a6ca7`, Feb 20 2026)
- `onnxruntime-web@1.25.0-dev.20260212`
- Vite 7.3.1
- Chrome (latest), macOS
