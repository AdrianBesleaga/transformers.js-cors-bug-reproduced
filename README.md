# Transformers.js v4 — CORS Reproduction

Minimal reproduction for [huggingface/transformers.js#1527](https://github.com/huggingface/transformers.js/issues/1527).

## Error

```
Failed to construct 'Worker': Script at
'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.25.0-dev.../dist'
cannot be accessed from origin 'http://localhost:5175'.
```

## Root Cause

In v4, `backends/onnx.js` sets `wasmPaths` to `cdn.jsdelivr.net` by default.
This works fine on its own — **but** when the page has **COEP headers** (`Cross-Origin-Embedder-Policy: require-corp`), browsers block all cross-origin resources that lack a `Cross-Origin-Resource-Policy` header, including the CDN-served ORT Worker script.

COEP headers are required for `SharedArrayBuffer`, which ONNX Runtime itself needs for multi-threaded WASM execution. So the conflict is:

1. ORT needs `SharedArrayBuffer` → requires COEP headers
2. COEP blocks cross-origin resources without CORP headers
3. v4 defaults `wasmPaths` to CDN → CDN files are cross-origin
4. **💥 Worker construction fails**

## Why `fs-eire` Could Not Reproduce

Without COEP headers, CDN loading works fine. The `vite.config.ts` in this repo includes a `crossOriginIsolation()` plugin that sets COEP/COOP headers — **remove it and the error disappears**.

## Reproduce

```bash
npm install
npm run dev
# Open http://localhost:5175 — error in console
```

## Fix the Error (remove COEP from vite.config.ts)

Delete the `crossOriginIsolation()` plugin from `vite.config.ts` — the error goes away, confirming the CDN `wasmPaths` alone are not the problem.

## Versions

- `@huggingface/transformers@4.0.0-next.3`
- `onnxruntime-web@1.25.0-dev.20260212`
- Vite 7.3.1
- Chrome (latest), macOS
