/**
 * Reproduction for https://github.com/huggingface/transformers.js/issues/1527
 *
 * The CORS error happens when ALL of these are true:
 *  1. wasmPaths points to CDN (the v4 default)
 *  2. The page has Cross-Origin-Embedder-Policy: require-corp (needed
 *     for SharedArrayBuffer, which ORT uses for multi-threaded WASM)
 *  3. CDN resources don't carry Cross-Origin-Resource-Policy headers
 *
 * Without COEP headers, CDN loading works fine.
 * With COEP headers, browsers block ALL cross-origin resources that
 * lack a Cross-Origin-Resource-Policy header — including ORT's WASM files.
 */

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

console.log('[Worker] Config:');
console.log('  wasmPaths:', JSON.stringify(env.backends.onnx?.wasm?.wasmPaths));
console.log('  proxy:', env.backends.onnx?.wasm?.proxy);
console.log('  crossOriginIsolated:', self.crossOriginIsolated);

self.postMessage({
    type: 'config',
    wasmPaths: env.backends.onnx?.wasm?.wasmPaths,
    proxy: env.backends.onnx?.wasm?.proxy,
    crossOriginIsolated: self.crossOriginIsolated,
});

console.log('[Worker] Loading sentiment-analysis pipeline (device: wasm)...');

try {
    // Use a tiny text model — we just need ORT to init WASM from CDN
    const classifier = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'wasm' }
    );

    const result = await classifier('This is a test');
    console.log('[Worker] Result:', result);
    self.postMessage({ type: 'success', message: JSON.stringify(result) });
} catch (error: any) {
    console.error('[Worker] Error:', error);
    self.postMessage({ type: 'error', message: error.message || String(error) });
}
